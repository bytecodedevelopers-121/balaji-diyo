import { Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateDestinationDtoType,
  UpdateDestinationDtoType,
  CreateTravelGuideDtoType,
  UpdateTravelGuideDtoType,
  GuideTopicDtoType,
  UpdateGuideTopicDtoType,
  CreateWebStoryDtoType,
  UpdateWebStoryDtoType,
} from './dto';

const ordered = [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }];

const publicGuideInclude = {
  topics: { where: { isActive: true }, orderBy: ordered },
} satisfies Prisma.TravelGuideInclude;
const adminGuideInclude = { topics: { orderBy: ordered } } satisfies Prisma.TravelGuideInclude;

export class SiteContentRepository {
  constructor(private prisma: PrismaClient) {}

  // ── Destinations ──────────────────────────────────────────────────────────
  listDestinations(onlyActive: boolean) {
    return this.prisma.destination.findMany({ where: onlyActive ? { isActive: true } : {}, orderBy: ordered });
  }
  findDestinationBySlug(slug: string, onlyActive: boolean) {
    return this.prisma.destination.findFirst({ where: { slug, ...(onlyActive ? { isActive: true } : {}) } });
  }
  createDestination(dto: CreateDestinationDtoType) {
    return this.prisma.destination.create({ data: dto });
  }
  updateDestination(id: string, dto: UpdateDestinationDtoType) {
    return this.prisma.destination.update({ where: { id }, data: dto });
  }
  deleteDestination(id: string) {
    return this.prisma.destination.delete({ where: { id } });
  }

  // ── Travel guides ─────────────────────────────────────────────────────────
  listGuides(onlyActive: boolean) {
    return this.prisma.travelGuide.findMany({
      where: onlyActive ? { isActive: true } : {},
      orderBy: ordered,
      include: onlyActive ? publicGuideInclude : adminGuideInclude,
    });
  }
  findGuideBySlug(slug: string, onlyActive: boolean) {
    return this.prisma.travelGuide.findFirst({
      where: { slug, ...(onlyActive ? { isActive: true } : {}) },
      include: onlyActive ? publicGuideInclude : adminGuideInclude,
    });
  }
  createGuide(dto: CreateTravelGuideDtoType) {
    return this.prisma.travelGuide.create({ data: dto });
  }
  updateGuide(id: string, dto: UpdateTravelGuideDtoType) {
    return this.prisma.travelGuide.update({ where: { id }, data: dto });
  }
  deleteGuide(id: string) {
    return this.prisma.travelGuide.delete({ where: { id } });
  }
  createTopic(guideId: string, dto: GuideTopicDtoType) {
    return this.prisma.travelGuideTopic.create({ data: { ...dto, guideId } });
  }
  updateTopic(id: string, dto: UpdateGuideTopicDtoType) {
    return this.prisma.travelGuideTopic.update({ where: { id }, data: dto });
  }
  deleteTopic(id: string) {
    return this.prisma.travelGuideTopic.delete({ where: { id } });
  }

  // ── Web stories ───────────────────────────────────────────────────────────
  listStories(onlyActive: boolean) {
    return this.prisma.webStory.findMany({ where: onlyActive ? { isActive: true } : {}, orderBy: ordered });
  }
  findStoryBySlug(slug: string, onlyActive: boolean) {
    return this.prisma.webStory.findFirst({ where: { slug, ...(onlyActive ? { isActive: true } : {}) } });
  }
  createStory(dto: CreateWebStoryDtoType) {
    return this.prisma.webStory.create({ data: dto });
  }
  updateStory(id: string, dto: UpdateWebStoryDtoType) {
    return this.prisma.webStory.update({ where: { id }, data: dto });
  }
  deleteStory(id: string) {
    return this.prisma.webStory.delete({ where: { id } });
  }
}
