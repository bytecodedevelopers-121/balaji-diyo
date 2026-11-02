import { Prisma } from '@prisma/client';
import { BookingRepository } from './booking.repository';
import { CreateBookingDtoType, GetBookingsDtoType, AddTravellersDtoType, CreateInvoiceDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { sendMail } from '../../lib/mail';
import { mailConfig } from '../../config/mail';
import { bookingAdminAlertEmail, bookingConfirmationEmail } from './booking.mail';

export class BookingService {
  constructor(private repository: BookingRepository) {}

  // No emails here: the booking confirmation + admin alert only go out once
  // PACO confirms the payment — see notifyPaid, called from
  // PaymentService#handlePacoCallback.
  async create(dto: CreateBookingDtoType, ipAddress?: string) {
    let booking;
    try {
      booking = await this.repository.create({ ...dto, ipAddress: ipAddress ?? null });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ApiError(400, 'Invalid packageId');
      }
      throw err;
    }

    return booking;
  }

  // Mirrors the legacy flow's own booking-notification emails (see
  // booking.mail.ts's own comments for exactly which flamingo-base
  // templates/behavior each one comes from) — fire-and-forget, same
  // shape as revalidateFrontendTags: a failed/unconfigured send must
  // never fail the payment webhook PACO is waiting on.
  async notifyPaid(bookingId: string) {
    const booking = await this.repository.findById(bookingId);
    if (!booking) return;

    void sendMail({ to: booking.email, ...bookingConfirmationEmail(booking) });
    if (mailConfig.adminEmail) {
      void sendMail({ to: mailConfig.adminEmail, ...bookingAdminAlertEmail(booking) });
    }
  }

  async findAll(dto: GetBookingsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.BookingWhereInput = {
      ...(dto.packageId ? { packageId: dto.packageId } : {}),
      ...(dto.search ? { OR: this.searchConditions(dto.search.trim()) } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  /** Name/email match, plus the customer-facing booking code: "BA-<package title>-<number>"
   *  (or just "BA-<number>" / "<number>") matches on the number, which is what's stored. */
  private searchConditions(search: string): Prisma.BookingWhereInput[] {
    const conditions: Prisma.BookingWhereInput[] = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
    const code = /^(?:BA-(?:.*-)?)?(\d{1,9})$/i.exec(search);
    if (code) conditions.push({ bookingNumber: Number(code[1]) });
    return conditions;
  }

  async findById(id: string) {
    const booking = await this.repository.findById(id);
    if (!booking) throw new ApiError(404, 'Booking not found');
    return booking;
  }

  async addTravellers(bookingId: string, dto: AddTravellersDtoType) {
    await this.findById(bookingId);
    await this.repository.addTravellers(bookingId, dto.travellers);
    return this.findById(bookingId);
  }

  async createInvoice(bookingId: string, dto: CreateInvoiceDtoType) {
    await this.findById(bookingId);

    const existing = await this.repository.findInvoiceByBookingId(bookingId);
    if (existing) throw new ApiError(409, 'This booking already has an invoice');

    return this.repository.createInvoice(bookingId, dto);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repository.delete(id);
  }

  async bulkRemove(ids: string[]) {
    await this.repository.bulkDelete(ids);
  }
}
