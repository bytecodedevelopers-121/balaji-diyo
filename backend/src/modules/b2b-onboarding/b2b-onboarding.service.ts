import bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { ApiError } from '../../common/exceptions/api-error';
import { B2BOnboardingRepository } from './b2b-onboarding.repository';
import { KycStorage } from '../b2b-common/b2b-kyc-storage';
import { toPartnerView } from '../b2b-common/b2b-partner.mapper';
import type { RegisterPartnerDtoType, UploadKycDocumentDtoType } from './dto';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const generatePartnerCode = (): string => {
  const bytes = randomBytes(8);
  return `JT-${Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')}`;
};

const BCRYPT_COST = 12;

export class B2BOnboardingService {
  constructor(
    private repository: B2BOnboardingRepository,
    private storage: KycStorage,
  ) {}

  private assertFilesMatchTypes(files: Express.Multer.File[], docTypes: string[]): void {
    if (files.length !== docTypes.length) {
      throw new ApiError(400, 'Provide one docTypes entry for each uploaded document file');
    }
  }

  async register(dto: RegisterPartnerDtoType, files: Express.Multer.File[]) {
    this.assertFilesMatchTypes(files, dto.docTypes);

    if (await this.repository.findUserByEmail(dto.adminEmail)) {
      throw new ApiError(409, 'An account with this email already exists');
    }
    if (dto.taxOrRegNumber && (await this.repository.findPartnerByTaxNumber(dto.taxOrRegNumber))) {
      throw new ApiError(409, 'A partner with this tax / registration number is already registered');
    }

    const [tier, role] = await Promise.all([this.repository.findEntryTier(), this.repository.ensurePartnerRole()]);
    if (!tier) throw new ApiError(503, 'Partner registration is temporarily unavailable');

    const partnerId = randomUUID();
    const stored = await Promise.all(files.map((f) => this.storage.save(partnerId, f)));
    const documents = stored.map((s, i) => ({ docType: dto.docTypes[i] as string, ...s }));

    try {
      const passwordHash = await bcrypt.hash(dto.adminPassword, BCRYPT_COST);
      const { adminFirstName, adminLastName, adminEmail, adminPassword: _pw, docTypes: _dt, ...partner } = dto;
      const result = await this.repository.registerPartner({
        partnerId,
        partnerCode: generatePartnerCode(),
        tierId: tier.id,
        roleId: role.id,
        partner: stripUndefined(partner),
        admin: { email: adminEmail, passwordHash, firstName: adminFirstName, lastName: adminLastName },
        documents,
      });
      return { ...result, documentsSubmitted: documents.length };
    } catch (err) {
      await this.storage.removeQuietly(stored.map((s) => s.fileUrl));
      throw err;
    }
  }

  async getMyPartner(partnerId: string, b2bRole: string | null) {
    const partner = await this.repository.findPartnerDetail(partnerId);
    if (!partner) throw new ApiError(404, 'Partner not found');
    return { ...toPartnerView(partner), myRole: b2bRole };
  }

  async uploadKycDocuments(partnerId: string, userId: string, dto: UploadKycDocumentDtoType, files: Express.Multer.File[]) {
    if (files.length === 0) throw new ApiError(400, 'At least one document file is required');
    this.assertFilesMatchTypes(files, dto.docTypes);

    const stored = await Promise.all(files.map((f) => this.storage.save(partnerId, f)));
    try {
      const created = await this.repository.addKycDocuments(
        partnerId,
        userId,
        stored.map((s, i) => ({ docType: dto.docTypes[i] as string, ...s })),
      );
      if (!created) {
        throw new ApiError(403, 'KYC documents can only be submitted while your application is pending or rejected');
      }
      return created;
    } catch (err) {
      await this.storage.removeQuietly(stored.map((s) => s.fileUrl));
      throw err;
    }
  }

  /** Tenant-scoped: a document id from another partner resolves to 404, never a read. */
  async getMyKycFile(partnerId: string, docId: string) {
    const doc = await this.repository.findKycDocument(partnerId, docId);
    if (!doc) throw new ApiError(404, 'Document not found');
    return { absolutePath: this.storage.resolve(doc.fileUrl), fileName: doc.fileName ?? 'document' };
  }
}

const stripUndefined = <T extends Record<string, unknown>>(o: T): { [K in keyof T]: Exclude<T[K], undefined> } =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as { [K in keyof T]: Exclude<T[K], undefined> };
