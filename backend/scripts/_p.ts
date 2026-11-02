import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
(async () => {
  if (process.argv[2] === 'make') {
    for (const ref of ['QA-OK-1', 'QA-FAIL-1'])
      await p.payment.create({ data: { gateway: 'PACO', customerName: 'QA Lead', customerEmail: 'lead@example.com', description: 'QA', percentage: 20, totalAmount: 400, status: 'PENDING', gatewayReference: ref } });
  }
  console.log(await p.payment.findMany({ where: { gatewayReference: { startsWith: 'QA-' } }, select: { gatewayReference: true, status: true } }));
  await p.$disconnect();
})();
