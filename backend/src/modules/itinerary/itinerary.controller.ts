import { Request, Response } from 'express';
import { ItineraryService } from './itinerary.service';
import { CreateItineraryDto, UpdateItineraryDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class ItineraryController {
  constructor(private service: ItineraryService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateItineraryDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Itinerary created successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Itinerary retrieved successfully', data: result, req });
  };

  findByPackageId = async (req: Request, res: Response) => {
    const result = await this.service.findByPackageId(req.params.packageId as string);

    SuccessResponseDto.send(res, { message: 'Itinerary retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateItineraryDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Itinerary updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Itinerary deleted successfully', req });
  };
}
