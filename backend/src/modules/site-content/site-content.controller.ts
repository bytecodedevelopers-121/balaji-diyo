import { Request, Response } from 'express';
import { SiteContentService } from './site-content.service';
import {
  CreateDestinationDto,
  UpdateDestinationDto,
  CreateTravelGuideDto,
  UpdateTravelGuideDto,
  GuideTopicDto,
  UpdateGuideTopicDto,
  CreateWebStoryDto,
  UpdateWebStoryDto,
} from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class SiteContentController {
  constructor(private service: SiteContentService) {}

  private ok = (req: Request, res: Response, message: string, data?: unknown) =>
    SuccessResponseDto.send(res, { message, data, req });
  private created = (req: Request, res: Response, message: string, data: unknown) =>
    SuccessResponseDto.created(res, { message, data, req });

  // Destinations
  listDestinations = async (req: Request, res: Response) =>
    this.ok(req, res, 'Destinations retrieved successfully', await this.service.listDestinations());
  listDestinationsAdmin = async (req: Request, res: Response) =>
    this.ok(req, res, 'Destinations retrieved successfully', await this.service.listDestinations(true));
  getDestination = async (req: Request, res: Response) =>
    this.ok(req, res, 'Destination retrieved successfully', await this.service.getDestination(req.params.slug as string));
  getDestinationAdmin = async (req: Request, res: Response) =>
    this.ok(req, res, 'Destination retrieved successfully', await this.service.getDestination(req.params.slug as string, true));
  createDestination = async (req: Request, res: Response) =>
    this.created(req, res, 'Destination created successfully', await this.service.createDestination(CreateDestinationDto.parse(req.body)));
  updateDestination = async (req: Request, res: Response) =>
    this.ok(req, res, 'Destination updated successfully', await this.service.updateDestination(req.params.id as string, UpdateDestinationDto.parse(req.body)));
  deleteDestination = async (req: Request, res: Response) => {
    await this.service.deleteDestination(req.params.id as string);
    this.ok(req, res, 'Destination deleted successfully');
  };

  // Travel guides
  listGuides = async (req: Request, res: Response) =>
    this.ok(req, res, 'Travel guides retrieved successfully', await this.service.listGuides());
  listGuidesAdmin = async (req: Request, res: Response) =>
    this.ok(req, res, 'Travel guides retrieved successfully', await this.service.listGuides(true));
  getGuide = async (req: Request, res: Response) =>
    this.ok(req, res, 'Travel guide retrieved successfully', await this.service.getGuide(req.params.slug as string));
  getGuideAdmin = async (req: Request, res: Response) =>
    this.ok(req, res, 'Travel guide retrieved successfully', await this.service.getGuide(req.params.slug as string, true));
  createGuide = async (req: Request, res: Response) =>
    this.created(req, res, 'Travel guide created successfully', await this.service.createGuide(CreateTravelGuideDto.parse(req.body)));
  updateGuide = async (req: Request, res: Response) =>
    this.ok(req, res, 'Travel guide updated successfully', await this.service.updateGuide(req.params.id as string, UpdateTravelGuideDto.parse(req.body)));
  deleteGuide = async (req: Request, res: Response) => {
    await this.service.deleteGuide(req.params.id as string);
    this.ok(req, res, 'Travel guide deleted successfully');
  };
  createTopic = async (req: Request, res: Response) =>
    this.created(req, res, 'Topic created successfully', await this.service.createTopic(req.params.id as string, GuideTopicDto.parse(req.body)));
  updateTopic = async (req: Request, res: Response) =>
    this.ok(req, res, 'Topic updated successfully', await this.service.updateTopic(req.params.topicId as string, UpdateGuideTopicDto.parse(req.body)));
  deleteTopic = async (req: Request, res: Response) => {
    await this.service.deleteTopic(req.params.topicId as string);
    this.ok(req, res, 'Topic deleted successfully');
  };

  // Web stories
  listStories = async (req: Request, res: Response) =>
    this.ok(req, res, 'Web stories retrieved successfully', await this.service.listStories());
  listStoriesAdmin = async (req: Request, res: Response) =>
    this.ok(req, res, 'Web stories retrieved successfully', await this.service.listStories(true));
  getStory = async (req: Request, res: Response) =>
    this.ok(req, res, 'Web story retrieved successfully', await this.service.getStory(req.params.slug as string));
  getStoryAdmin = async (req: Request, res: Response) =>
    this.ok(req, res, 'Web story retrieved successfully', await this.service.getStory(req.params.slug as string, true));
  createStory = async (req: Request, res: Response) =>
    this.created(req, res, 'Web story created successfully', await this.service.createStory(CreateWebStoryDto.parse(req.body)));
  updateStory = async (req: Request, res: Response) =>
    this.ok(req, res, 'Web story updated successfully', await this.service.updateStory(req.params.id as string, UpdateWebStoryDto.parse(req.body)));
  deleteStory = async (req: Request, res: Response) => {
    await this.service.deleteStory(req.params.id as string);
    this.ok(req, res, 'Web story deleted successfully');
  };
}
