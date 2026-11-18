/**
 * Migrate the ENTIRE current database (Neon) to the PostgreSQL database on
 * Himalayan Host.
 *
 * The host blocks outbound DB connections, so the normal way is two steps
 * through a file:
 *
 *   STEP 1 - on YOUR PC (can reach Neon). Source = DATABASE_URL in backend/.env
 *     npm run migrate:himalayan -- --export joyful-data.json.gz
 *
 *   (upload joyful-data.json.gz to the server, e.g. into ~/joyfulbackend)
 *
 *   STEP 2 - on the SERVER (target = the server's DATABASE_URL, i.e. localhost)
 *     npx prisma migrate deploy                       # only if tables don't exist yet
 *     npm run migrate:himalayan -- --import joyful-data.json.gz --truncate
 *
 * Direct mode (only if one machine can reach BOTH databases):
 *     SOURCE_DATABASE_URL=... TARGET_DATABASE_URL=... npm run migrate:himalayan -- --truncate
 *
 * Flags
 *   --export <file>   read source DB, write a gzip file (source is never modified)
 *   --import <file>   load that file into the target DB
 *   --truncate        empty target tables first (needed if target already has data,
 *                     e.g. after `prisma db seed`)
 *
 * Env
 *   SOURCE_DATABASE_URL  defaults to DATABASE_URL
 *   TARGET_DATABASE_URL  defaults to DATABASE_URL
 */
import "dotenv/config";
import { Pool } from "pg";
import fs from "fs";
import zlib from "zlib";
import readline from "readline";

const BATCH = 500;
const TRUNCATE = process.argv.includes("--truncate");
const argVal = (flag: string) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const EXPORT_FILE = argVal("--export");
const IMPORT_FILE = argVal("--import");

const q = (id: string) => `"${id.replace(/"/g, '""')}"`;
const host = (u: string) => {
  try {
    return new URL(u).host;
  } catch {
    return "?";
  }
};

type Meta = { order: string[]; counts: Record<string, number> };
type Chunk = { t: string; rows: unknown[] };

async function listTables(pool: Pool): Promise<string[]> {
  const r = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' AND table_type='BASE TABLE'
       AND table_name <> '_prisma_migrations'`
  );
  return r.rows.map((x) => x.table_name);
}

/** Parents before children (FK order). Tables in a cycle are appended at the end. */
async function fkOrder(pool: Pool, tables: string[]): Promise<string[]> {
  const r = await pool.query(
    `SELECT c.conrelid::regclass::text AS child, c.confrelid::regclass::text AS parent
     FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
     WHERE c.contype='f' AND n.nspname='public'`
  );
  const clean = (s: string) => s.replace(/^public\./, "").replace(/"/g, "");
  const deps = new Map<string, Set<string>>(tables.map((t) => [t, new Set()]));
  for (const row of r.rows) {
    const child = clean(row.child);
    const parent = clean(row.parent);
    if (child !== parent && deps.has(child) && deps.has(parent)) deps.get(child)!.add(parent);
  }
  const order: string[] = [];
  const remaining = new Set(tables);
  while (remaining.size) {
    const ready = [...remaining].filter((t) => [...deps.get(t)!].every((d) => !remaining.has(d)));
    if (!ready.length) break;
    ready.sort().forEach((t) => {
      order.push(t);
      remaining.delete(t);
    });
  }
  return order.concat([...remaining].sort());
}

async function readMeta(src: Pool): Promise<Meta> {
  const tables = await listTables(src);
  const order = await fkOrder(src, tables);
  const counts: Record<string, number> = {};
  for (const t of order) counts[t] = Number((await src.query(`SELECT count(*) FROM ${q(t)}`)).rows[0].count);
  return { order, counts };
}

async function* readSource(src: Pool, meta: Meta): AsyncGenerator<Chunk> {
  for (const t of meta.order) {
    for (let off = 0; off < meta.counts[t]; off += BATCH) {
      const r = await src.query(
        `SELECT to_json(x) AS j FROM (SELECT * FROM ${q(t)} ORDER BY ctid LIMIT ${BATCH} OFFSET ${off}) x`
      );
      if (!r.rowCount) break;
      yield { t, rows: r.rows.map((x) => x.j) };
    }
  }
}

/** Write source DB to a gzip NDJSON file. */
async function doExport(file: string) {
  const url = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("No source DB: set DATABASE_URL (or SOURCE_DATABASE_URL)");
  console.log(`Exporting from ${host(url)} -> ${file}\n`);
  const src = new Pool({ connectionString: url, max: 1 });
  try {
    const meta = await readMeta(src);
    const gz = zlib.createGzip();
    const out = fs.createWriteStream(file);
    gz.pipe(out);
    const write = (o: unknown) =>
      new Promise<void>((res) => (gz.write(JSON.stringify(o) + "\n") ? res() : gz.once("drain", res)));
    await write({ meta });
    const done: Record<string, number> = {};
    for await (const c of readSource(src, meta)) {
      await write(c);
      done[c.t] = (done[c.t] || 0) + c.rows.length;
    }
    for (const t of meta.order) console.log(`  ${t.padEnd(35)} ${done[t] || 0}/${meta.counts[t]}`);
    await new Promise<void>((res, rej) => {
      out.on("finish", res).on("error", rej);
      gz.end();
    });
    console.log(`\nDONE. Upload ${file} (${(fs.statSync(file).size / 1024).toFixed(0)} KB) to the server.`);
  } finally {
    await src.end();
  }
}

async function* readFile(file: string): AsyncGenerator<{ meta?: Meta; chunk?: Chunk }> {
  const rl = readline.createInterface({
    input: fs.createReadStream(file).pipe(zlib.createGunzip()),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const o = JSON.parse(line);
    yield o.meta ? { meta: o.meta } : { chunk: o };
  }
}

/** Load chunks into the target DB, reset sequences, verify counts. */
async function load(dst: Pool, meta: Meta, chunks: AsyncIterable<Chunk>) {
  const dstTables = new Set(await listTables(dst));
  const missing = meta.order.filter((t) => !dstTables.has(t));
  if (missing.length)
    throw new Error(`Target is missing tables: ${missing.join(", ")}\nRun: npx prisma migrate deploy`);

  const client = await dst.connect();
  try {
    console.log("Checking target is empty...");
    const nonEmpty: string[] = [];
    for (const t of meta.order) {
      if ((await client.query(`SELECT 1 FROM ${q(t)} LIMIT 1`)).rowCount) nonEmpty.push(t);
    }
    if (nonEmpty.length && !TRUNCATE)
      throw new Error(`Target already has data in: ${nonEmpty.join(", ")}\nRe-run with --truncate.`);
    if (nonEmpty.length) console.log("  --truncate: clearing target tables");

    let relaxed = false;
    try {
      await client.query("SET session_replication_role = replica"); // skips FK checks if allowed
      relaxed = true;
    } catch {
      /* normal on shared hosting; FK order handles it */
    }

    console.log("Copying data...");
    await client.query("BEGIN");
    try {
      if (nonEmpty.length)
        await client.query(`TRUNCATE ${meta.order.map(q).join(", ")} RESTART IDENTITY CASCADE`);
      const done: Record<string, number> = {};
      for await (const c of chunks) {
        await client.query(
          `INSERT INTO ${q(c.t)} SELECT * FROM json_populate_recordset(null::${q(c.t)}, $1::json)`,
          [JSON.stringify(c.rows)]
        );
        done[c.t] = (done[c.t] || 0) + c.rows.length;
      }
      for (const t of meta.order) console.log(`  ${t.padEnd(35)} ${done[t] || 0}/${meta.counts[t]}`);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
    if (relaxed) await client.query("SET session_replication_role = DEFAULT");

    console.log("Resetting sequences & verifying...");
    const seqs = await client.query(
      `SELECT t.relname AS tbl, a.attname AS col
       FROM pg_class s
       JOIN pg_depend d ON d.objid = s.oid AND d.deptype IN ('a','i')
       JOIN pg_class t ON t.oid = d.refobjid
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
       JOIN pg_namespace n ON n.oid = s.relnamespace
       WHERE s.relkind = 'S' AND n.nspname = 'public'`
    );
    for (const s of seqs.rows) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence($1, $2),
                       COALESCE((SELECT MAX(${q(s.col)}) FROM ${q(s.tbl)}), 0) + 1, false)`,
        [`public.${q(s.tbl)}`, s.col]
      );
    }
    console.log(`  reset ${seqs.rowCount} sequence(s)`);

    let bad = 0;
    for (const t of meta.order) {
      const n = Number((await client.query(`SELECT count(*) FROM ${q(t)}`)).rows[0].count);
      if (n !== meta.counts[t]) {
        bad++;
        console.log(`  MISMATCH ${t}: expected=${meta.counts[t]} target=${n}`);
      }
    }
    if (bad) throw new Error(`${bad} table(s) have different row counts`);
    console.log(`  all ${meta.order.length} tables match.`);
  } finally {
    client.release();
  }
}

async function doImport(file: string) {
  const url = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("No target DB: set DATABASE_URL (or TARGET_DATABASE_URL)");
  if (!fs.existsSync(file)) throw new Error(`File not found: ${file}`);
  console.log(`Importing ${file} -> ${host(url)}\n`);

  let meta: Meta | undefined;
  for await (const o of readFile(file)) {
    meta = o.meta;
    break;
  }
  if (!meta) throw new Error("Invalid file (no header)");
  async function* chunks(): AsyncGenerator<Chunk> {
    for await (const o of readFile(file)) if (o.chunk) yield o.chunk;
  }
  const dst = new Pool({ connectionString: url, max: 1 });
  try {
    await load(dst, meta, chunks());
  } finally {
    await dst.end();
  }
  console.log("\nDONE. Restart the Node app in cPanel.");
}

async function doDirect() {
  const s = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
  const t = process.env.TARGET_DATABASE_URL;
  if (!s || !t) throw new Error("Direct mode needs SOURCE_DATABASE_URL and TARGET_DATABASE_URL");
  if (s === t) throw new Error("Source and target are the same database. Aborting.");
  console.log(`Source ${host(s)} -> Target ${host(t)}\n`);
  const src = new Pool({ connectionString: s, max: 1 });
  const dst = new Pool({ connectionString: t, max: 1 });
  try {
    const meta = await readMeta(src);
    await load(dst, meta, readSource(src, meta));
  } finally {
    await src.end();
    await dst.end();
  }
  console.log("\nDONE.");
}

(async () => {
  if (EXPORT_FILE) await doExport(EXPORT_FILE);
  else if (IMPORT_FILE) await doImport(IMPORT_FILE);
  else await doDirect();
})().catch((e) => {
  console.error("\nMIGRATION FAILED:", e.message || e);
  process.exit(1);
});
