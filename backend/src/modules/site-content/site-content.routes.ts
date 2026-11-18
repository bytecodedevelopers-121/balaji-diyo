import { Router } from 'express';
import { siteContentController as c } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

/** Public reads + admin CRUD for destinations, travel guides and web stories. */

export const destinationRoutes = Router();
destinationRoutes.get('/', asyncHandler(c.listDestinations));
destinationRoutes.get('/admin/all', authenticate, authorize('read:travel'), asyncHandler(c.listDestinationsAdmin));
destinationRoutes.get('/admin/:slug', authenticate, authorize('read:travel'), asyncHandler(c.getDestinationAdmin));
destinationRoutes.get('/:slug', asyncHandler(c.getDestination));
destinationRoutes.post('/', authenticate, authorize('create:travel'), asyncHandler(c.createDestination));
destinationRoutes.patch('/:id', authenticate, authorize('update:travel'), asyncHandler(c.updateDestination));
destinationRoutes.delete('/:id', authenticate, authorize('delete:travel'), asyncHandler(c.deleteDestination));

export const travelGuideRoutes = Router();
travelGuideRoutes.get('/', asyncHandler(c.listGuides));
travelGuideRoutes.get('/admin/all', authenticate, authorize('read:travel'), asyncHandler(c.listGuidesAdmin));
travelGuideRoutes.get('/admin/:slug', authenticate, authorize('read:travel'), asyncHandler(c.getGuideAdmin));
travelGuideRoutes.get('/:slug', asyncHandler(c.getGuide));
travelGuideRoutes.post('/', authenticate, authorize('create:travel'), asyncHandler(c.createGuide));
travelGuideRoutes.patch('/:id', authenticate, authorize('update:travel'), asyncHandler(c.updateGuide));
travelGuideRoutes.delete('/:id', authenticate, authorize('delete:travel'), asyncHandler(c.deleteGuide));
travelGuideRoutes.post('/:id/topics', authenticate, authorize('create:travel'), asyncHandler(c.createTopic));
travelGuideRoutes.patch('/:id/topics/:topicId', authenticate, authorize('update:travel'), asyncHandler(c.updateTopic));
travelGuideRoutes.delete('/:id/topics/:topicId', authenticate, authorize('delete:travel'), asyncHandler(c.deleteTopic));

export const webStoryRoutes = Router();
webStoryRoutes.get('/', asyncHandler(c.listStories));
webStoryRoutes.get('/admin/all', authenticate, authorize('read:travel'), asyncHandler(c.listStoriesAdmin));
webStoryRoutes.get('/admin/:slug', authenticate, authorize('read:travel'), asyncHandler(c.getStoryAdmin));
webStoryRoutes.get('/:slug', asyncHandler(c.getStory));
webStoryRoutes.post('/', authenticate, authorize('create:travel'), asyncHandler(c.createStory));
webStoryRoutes.patch('/:id', authenticate, authorize('update:travel'), asyncHandler(c.updateStory));
webStoryRoutes.delete('/:id', authenticate, authorize('delete:travel'), asyncHandler(c.deleteStory));
