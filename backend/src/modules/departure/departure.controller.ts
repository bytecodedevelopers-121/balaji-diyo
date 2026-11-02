import { Request, Response } from 'express';
import { DepartureService } from './departure.service';
import { CreateDepartureDto, CreateDeparturesBulkDto, UpdateDepartureDto, GetDeparturesDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class DepartureController {
  constructor(private service: DepartureService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateDepartureDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Departure created successfully', data: result, req });
  };

  createBulk = async (req: Request, res: Response) => {
    const dto = CreateDeparturesBulkDto.parse(req.body);
    const result = await this.service.createBulk(dto);

    SuccessResponseDto.created(res, { message: 'Departures created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetDeparturesDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Departures retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Departure retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateDepartureDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Departure updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Departure deleted successfully', req });
  };
}
