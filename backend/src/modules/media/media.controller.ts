import { Request, Response } from 'express';
import { MediaService } from './media.service';
import { UpdateMediaDto, GetMediaDto, UploadMediaDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { ApiError } from '../../common/exceptions/api-error';

export class MediaController {
  constructor(private service: MediaService) {}

  upload = async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('No file uploaded');
    const dto = UploadMediaDto.parse(req.body);

    const result = await this.service.uploadAndCreate(req.file.buffer, req.file.originalname, req.file.mimetype, dto.altText, dto.folder);

    SuccessResponseDto.created(res, { message: 'Media uploaded successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetMediaDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Media retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Media retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateMediaDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Media updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Media deleted successfully', req });
  };
}
