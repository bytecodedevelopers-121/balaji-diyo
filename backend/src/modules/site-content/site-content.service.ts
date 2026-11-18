import { Prisma } from '@prisma/client';
import { SiteContentRepository } from './site-content.repository';
import { ApiError } from '../../common/exceptions/api-error';
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

export class SiteContentService {
  constructor(private repository: SiteContentRepository) {}

  /** Maps unique-slug and missing-row Prisma errors to friendly API errors. */
  private async write<T>(fn: () => Promise<T>, what: string): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') throw new ApiError(409, `${what} slug already exists`);
        if (err.code === 'P2025') throw new ApiError(404, `${what} not found`);
      }
      throw err;
    }
  }

  private found<T>(row: T | null, what: string): T {
    if (!row) throw new ApiError(404, `${what} not found`);
    return row;
  }

  // Destinations
  listDestinations(admin = false) {
    return this.repository.listDestinations(!admin);
  }
  async getDestination(slug: string, admin = false) {
    return this.found(await this.repository.findDestinationBySlug(slug, !admin), 'Destination');
  }
  createDestination(dto: CreateDestinationDtoType) {
    return this.write(() => this.repository.createDestination(dto), 'Destination');
  }
  updateDestination(id: string, dto: UpdateDestinationDtoType) {
    return this.write(() => this.repository.updateDestination(id, dto), 'Destination');
  }
  deleteDestination(id: string) {
    return this.write(() => this.repository.deleteDestination(id), 'Destination');
  }

  // Travel guides
  listGuides(admin = false) {
    return this.repository.listGuides(!admin);
  }
  async getGuide(slug: string, admin = false) {
    return this.found(await this.repository.findGuideBySlug(slug, !admin), 'Travel guide');
  }
  createGuide(dto: CreateTravelGuideDtoType) {
    return this.write(() => this.repository.createGuide(dto), 'Travel guide');
  }
  updateGuide(id: string, dto: UpdateTravelGuideDtoType) {
    return this.write(() => this.repository.updateGuide(id, dto), 'Travel guide');
  }
  deleteGuide(id: string) {
    return this.write(() => this.repository.deleteGuide(id), 'Travel guide');
  }
  createTopic(guideId: string, dto: GuideTopicDtoType) {
    return this.write(() => this.repository.createTopic(guideId, dto), 'Topic');
  }
  updateTopic(id: string, dto: UpdateGuideTopicDtoType) {
    return this.write(() => this.repository.updateTopic(id, dto), 'Topic');
  }
  deleteTopic(id: string) {
    return this.write(() => this.repository.deleteTopic(id), 'Topic');
  }

  // Web stories
  listStories(admin = false) {
    return this.repository.listStories(!admin);
  }
  async getStory(slug: string, admin = false) {
    return this.found(await this.repository.findStoryBySlug(slug, !admin), 'Web story');
  }
  createStory(dto: CreateWebStoryDtoType) {
    return this.write(() => this.repository.createStory(dto), 'Web story');
  }
  updateStory(id: string, dto: UpdateWebStoryDtoType) {
    return this.write(() => this.repository.updateStory(id, dto), 'Web story');
  }
  deleteStory(id: string) {
    return this.write(() => this.repository.deleteStory(id), 'Web story');
  }
}
