import { Request, Response } from 'express';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { CreateServiceDto, GetServicesDto, UpdateServiceDto, UpdateServiceSectionDto } from './dto';
import { ServiceService } from './service.service';

export class ServiceController {
  constructor(private service: ServiceService) {}

  create = async (req: Request, res: Response) => {
    const result = await this.service.create(CreateServiceDto.parse(req.body));
    SuccessResponseDto.created(res, { message: 'Service created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const result = await this.service.findAll(GetServicesDto.parse(req.query));
    SuccessResponseDto.send(res, { message: 'Services retrieved successfully', data: result, req });
  };

  findPublic = async (req: Request, res: Response) => {
    const result = await this.service.findPublic();
    SuccessResponseDto.send(res, { message: 'Public services retrieved successfully', data: result, req });
  };

  findSectionConfig = async (req: Request, res: Response) => {
    const result = await this.service.findSectionConfig();
    SuccessResponseDto.send(res, { message: 'Service section configuration retrieved successfully', data: result, req });
  };

  updateSectionConfig = async (req: Request, res: Response) => {
    const result = await this.service.updateSectionConfig(UpdateServiceSectionDto.parse(req.body));
    SuccessResponseDto.send(res, { message: 'Service section configuration updated successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);
    SuccessResponseDto.send(res, { message: 'Service retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const result = await this.service.update(req.params.id as string, UpdateServiceDto.parse(req.body));
    SuccessResponseDto.send(res, { message: 'Service updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);
    SuccessResponseDto.send(res, { message: 'Service deleted successfully', req });
  };
}
