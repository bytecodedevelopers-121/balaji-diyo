import { Prisma } from '@prisma/client';
import { ContactMessageRepository } from './contact-message.repository';
import { CreateContactMessageDtoType, GetContactMessagesDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { sendMail } from '../../lib/mail';
import { lookupIpGeolocation } from '../../lib/ip-geolocation';
import { mailConfig } from '../../config/mail';
import { enquiryAdminAlertEmail } from './contact-message.mail';

export class ContactMessageService {
  constructor(private repository: ContactMessageRepository) {}

  // Fire-and-forget, same shape as booking.service.ts's own notification
  // email (and revalidateFrontendTags before it): a failed/unconfigured
  // send must never fail the write itself. The geolocation lookup is
  // awaited (not fire-and-forget) since the resolved country/countryCode
  // need to be on `message` before it's saved and mailed — it degrades to
  // both fields being null rather than throwing, so this never blocks a
  // submission either.
  async create(dto: CreateContactMessageDtoType, ipAddress?: string) {
    const geo = await lookupIpGeolocation(ipAddress);
    const message = await this.repository.create({
      ...dto,
      ipAddress: ipAddress ?? null,
      country: geo?.country ?? null,
      countryCode: geo?.countryCode ?? null,
    });

    if (mailConfig.enquiryAdminEmails) {
      void sendMail({ to: mailConfig.enquiryAdminEmails, ...enquiryAdminAlertEmail(message) });
    }

    return message;
  }

  async findAll(dto: GetContactMessagesDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.ContactMessageWhereInput = {
      ...(dto.isRead !== undefined ? { isRead: dto.isRead } : {}),
      ...(dto.search
        ? { OR: [{ name: { contains: dto.search, mode: 'insensitive' } }, { email: { contains: dto.search, mode: 'insensitive' } }] }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  private async assertExists(id: string) {
    const message = await this.repository.findById(id);
    if (!message) throw new ApiError(404, 'Contact message not found');
    return message;
  }

  async findById(id: string) {
    return this.assertExists(id);
  }

  async setRead(id: string, isRead: boolean) {
    await this.assertExists(id);
    return this.repository.setRead(id, isRead);
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.repository.delete(id);
  }

  async bulkRemove(ids: string[]) {
    await this.repository.bulkDelete(ids);
  }
}
