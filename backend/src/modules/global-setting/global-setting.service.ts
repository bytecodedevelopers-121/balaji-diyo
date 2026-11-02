import { Prisma } from '@prisma/client';
import { GlobalSettingRepository } from './global-setting.repository';
import { CreateGlobalSettingDtoType, UpdateGlobalSettingDtoType, GetGlobalSettingsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';

// Mirrors the legacy getSettingValueAttribute() convenience accessor —
// resolves the one populated value column based on valueType.
const resolveValue = (setting: { valueType: string; value: string | null; jsonValue: unknown }) =>
  setting.valueType === 'JSON' ? setting.jsonValue : setting.value;

export class GlobalSettingService {
  constructor(private repository: GlobalSettingRepository) {}

  async create(dto: CreateGlobalSettingDtoType) {
    const existing = await this.repository.findByKey(dto.key);
    if (existing) throw new ApiError(409, 'A setting with this key already exists');

    try {
      const setting = await this.repository.create(dto as Prisma.GlobalSettingUncheckedCreateInput);
      return { ...setting, resolvedValue: resolveValue(setting) };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ApiError(400, 'Invalid categoryId');
      }
      throw err;
    }
  }

  async findAll(dto: GetGlobalSettingsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.GlobalSettingWhereInput = {
      deletedAt: null,
      ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
      ...(dto.keyGroup ? { keyGroup: dto.keyGroup } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.search ? { key: { contains: dto.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({
      items: items.map((s) => ({ ...s, resolvedValue: resolveValue(s) })),
      page: pagination.page,
      perPage: pagination.perPage,
      total,
    });
  }

  async findById(id: string) {
    const setting = await this.repository.findById(id);
    if (!setting || setting.deletedAt) throw new ApiError(404, 'Setting not found');
    return { ...setting, resolvedValue: resolveValue(setting) };
  }

  // Public — frontend consumption of a single site-wide setting (e.g. contact
  // email, social links). Only surfaces active settings. `valueType` rides
  // along so the controller (which alone has `req`) knows whether to turn
  // an IMAGE setting's raw storage path into an absolute URL.
  async findPublicByKey(key: string) {
    const setting = await this.repository.findByKey(key);
    if (!setting || setting.deletedAt || !setting.isActive) throw new ApiError(404, 'Setting not found');
    return { key: setting.key, valueType: setting.valueType, resolvedValue: resolveValue(setting) };
  }

  // Public — every active setting in one request (logo, contact info,
  // socials, ...), so the public site's Header/Footer don't need one round
  // trip per key. Same `valueType` pass-through as findPublicByKey above,
  // for the same reason.
  async findAllPublic() {
    const settings = await this.repository.findManyActive();
    return settings.map((s) => ({ key: s.key, valueType: s.valueType, resolvedValue: resolveValue(s) }));
  }

  async update(id: string, dto: UpdateGlobalSettingDtoType) {
    const existing = await this.findById(id);

    if (existing.isProtected && (dto.key || dto.valueType)) {
      throw new ApiError(403, 'This setting is protected — key and valueType cannot be changed');
    }

    if (dto.key) {
      const conflict = await this.repository.findByKey(dto.key);
      if (conflict && conflict.id !== id) throw new ApiError(409, 'A setting with this key already exists');
    }

    try {
      const setting = await this.repository.update(id, dto as Prisma.GlobalSettingUncheckedUpdateInput);
      return { ...setting, resolvedValue: resolveValue(setting) };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ApiError(400, 'Invalid categoryId');
      }
      throw err;
    }
  }

  async remove(id: string) {
    const existing = await this.findById(id);
    if (existing.isProtected) throw new ApiError(403, 'This setting is protected and cannot be deleted');

    await this.repository.softDelete(id);
  }
}
