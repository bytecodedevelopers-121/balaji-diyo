import { Request, Response } from 'express';
import { CustomBookingService } from './custom-booking.service';
import { CreateCustomBookingDto, GetCustomBookingsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class CustomBookingController {
  constructor(private service: CustomBookingService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateCustomBookingDto.parse(req.body);
    const result = await this.service.create(dto, req.ip);

    SuccessResponseDto.created(res, { message: 'Custom booking received successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetCustomBookingsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Custom bookings retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Custom booking retrieved successfully', data: result, req });
  };
}
