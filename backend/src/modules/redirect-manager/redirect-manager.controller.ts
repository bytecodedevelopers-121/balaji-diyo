import { Request, Response } from 'express';
import { RedirectManagerService } from './redirect-manager.service';
import { CreateRedirectDto, CreateRedirectsBulkDto, UpdateRedirectDto, GetRedirectsDto } from './dto';
import { BulkIdsDto } from '../../common/dto/bulk-ids.dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { ApiError } from '../../common/exceptions/api-error';

export class RedirectManagerController {
  constructor(private service: RedirectManagerService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateRedirectDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Redirect created successfully', data: result, req });
  };

  createBulk = async (req: Request, res: Response) => {
    const dto = CreateRedirectsBulkDto.parse(req.body);
    const result = await this.service.createBulk(dto);

    SuccessResponseDto.created(res, { message: 'Redirects created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetRedirectsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Redirects retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Redirect retrieved successfully', data: result, req });
  };

  resolve = async (req: Request, res: Response) => {
    const source = req.query.path as string | undefined;
    if (!source) throw ApiError.badRequest('path query param is required');

    // Redirect misses are safe to cache briefly and hits for longer. This
    // keeps Proxy traffic from turning every page request into a database
    // query when the API is served behind a shared cache/CDN.
    res.setHeader('Vary', 'Accept-Encoding');

    const result = await this.service.resolve(source);
    if (!result) {
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=60');
      SuccessResponseDto.send(res, { message: 'No redirect found', data: null, req });
      return;
    }

    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    SuccessResponseDto.send(res, { message: 'Redirect found', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateRedirectDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Redirect updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Redirect deleted successfully', req });
  };

  bulkRemove = async (req: Request, res: Response) => {
    const dto = BulkIdsDto.parse(req.body);
    await this.service.bulkRemove(dto.ids);

    SuccessResponseDto.send(res, { message: 'Redirects deleted successfully', req });
  };
}
