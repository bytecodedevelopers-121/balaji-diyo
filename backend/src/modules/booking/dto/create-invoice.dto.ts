import { z } from 'zod';

export const CreateInvoiceDto = z.object({
  invoiceAmount: z.number().min(0),
  invoicePayType: z.string().min(1),
  invoiceStatus: z.number().int(),
  invoiceNote: z.string().optional(),
  transactionCode: z.string().min(1),
});

export type CreateInvoiceDtoType = z.infer<typeof CreateInvoiceDto>;
