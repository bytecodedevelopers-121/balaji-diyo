interface Entry {
  table: string;
  expected: number;
  imported: number;
  note?: string;
}

// Every legacy table touched (or deliberately skipped) gets one entry, so the
// final printout makes drops visible instead of silent.
class Report {
  private entries: Entry[] = [];

  record(table: string, expected: number, imported: number, note?: string): void {
    this.entries.push({ table, expected, imported, note });
  }

  skip(table: string, expected: number, reason: string): void {
    this.entries.push({ table, expected, imported: 0, note: `SKIPPED — ${reason}` });
  }

  tables(): string[] {
    return this.entries.map((e) => e.table);
  }

  print(): void {
    console.log('\n=== Legacy import summary ===');
    const width = Math.max(...this.entries.map((e) => e.table.length), 5);
    for (const e of this.entries) {
      const mismatch = e.expected !== e.imported && !e.note?.startsWith('SKIPPED');
      const flag = mismatch ? '  <-- MISMATCH' : '';
      console.log(
        `${e.table.padEnd(width)}  expected=${e.expected}  imported=${e.imported}${e.note ? `  (${e.note})` : ''}${flag}`,
      );
    }
    const mismatches = this.entries.filter(
      (e) => e.expected !== e.imported && !e.note?.startsWith('SKIPPED'),
    );
    console.log(
      mismatches.length === 0
        ? '\nAll non-skipped tables imported the expected row count.'
        : `\n${mismatches.length} table(s) with a row-count mismatch — see MISMATCH lines above.`,
    );
  }
}

export const report = new Report();
