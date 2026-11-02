import { Request, Response } from 'express';
import { BookingService } from './booking.service';
import { CreateBookingDto, GetBookingsDto, AddTravellersDto, CreateInvoiceDto } from './dto';
import { BulkIdsDto } from '../../common/dto/bulk-ids.dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class BookingController {
  constructor(private service: BookingService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateBookingDto.parse(req.body);
    const result = await this.service.create(dto, req.ip);

    SuccessResponseDto.created(res, { message: 'Booking received successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetBookingsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Bookings retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Booking retrieved successfully', data: result, req });
  };

  addTravellers = async (req: Request, res: Response) => {
    const dto = AddTravellersDto.parse(req.body);
    const result = await this.service.addTravellers(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Travellers added successfully', data: result, req });
  };

  createInvoice = async (req: Request, res: Response) => {
    const dto = CreateInvoiceDto.parse(req.body);
    const result = await this.service.createInvoice(req.params.id as string, dto);

    SuccessResponseDto.created(res, { message: 'Invoice created successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Booking deleted successfully', req });
  };

  bulkRemove = async (req: Request, res: Response) => {
    const dto = BulkIdsDto.parse(req.body);
    await this.service.bulkRemove(dto.ids);

    SuccessResponseDto.send(res, { message: 'Bookings deleted successfully', req });
  };
}
