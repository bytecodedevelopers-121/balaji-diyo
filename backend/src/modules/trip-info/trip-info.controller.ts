import { Request, Response } from 'express';
import { TripInfoService } from './trip-info.service';
import { CreateTripInfoDto, UpdateTripInfoDto, GetTripInfosDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class TripInfoController {
  constructor(private service: TripInfoService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateTripInfoDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Trip info created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetTripInfosDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Trip infos retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Trip info retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateTripInfoDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Trip info updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Trip info deleted successfully', req });
  };
}
