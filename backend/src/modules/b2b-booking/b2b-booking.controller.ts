import { Request, Response } from 'express';
import { B2BBookingService } from './b2b-booking.service';
import {
  InstantBookingDto, OnRequestBookingDto, ListBookingsQueryDto, BookingParamsDto, CancelBookingDto, AmendBookingDto,
  ApproveBookingDto, RejectBookingDto, ResolveAmendmentDto, AdminCancelDto,
} from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { ApiError } from '../../common/exceptions/api-error';
import { partnerScope } from '../../common/guards/b2b.guard';

export class B2BBookingController {
  constructor(private service: B2BBookingService) {}

  instant = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const data = await this.service.createInstant(partnerId, userId, InstantBookingDto.parse(req.body));
    SuccessResponseDto.created(res, { message: 'replayed' in data && data.replayed ? 'Booking already confirmed' : 'Booking confirmed', data, req });
  };

  onRequest = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const data = await this.service.createOnRequest(partnerId, userId, OnRequestBookingDto.parse(req.body));
    SuccessResponseDto.created(res, { message: 'Request submitted for approval', data, req });
  };

  list = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const pagination = await this.service.listPartner(partnerId, ListBookingsQueryDto.parse(req.query));
    SuccessResponseDto.paginated<unknown>(res, { message: "Bookings retrieved successfully", pagination, req });
  };

  get = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const { id } = BookingParamsDto.parse(req.params);
    SuccessResponseDto.send(res, { message: 'Booking retrieved successfully', data: await this.service.getPartnerBooking(partnerId, id), req });
  };

  cancel = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const { id } = BookingParamsDto.parse(req.params);
    const data = await this.service.cancel({ kind: 'partner', partnerId, userId }, id, CancelBookingDto.parse(req.body ?? {}));
    SuccessResponseDto.send(res, { message: 'Booking cancelled', data, req });
  };

  amend = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const { id } = BookingParamsDto.parse(req.params);
    const data = await this.service.requestAmendment(partnerId, userId, id, AmendBookingDto.parse(req.body));
    SuccessResponseDto.created(res, { message: 'Amendment requested', data, req });
  };
}

const adminId = (req: Request): string => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  return req.user.userId;
};

export class B2BBookingAdminController {
  constructor(private service: B2BBookingService) {}

  list = async (req: Request, res: Response) => {
    const pagination = await this.service.listAdmin(ListBookingsQueryDto.parse(req.query));
    SuccessResponseDto.paginated<unknown>(res, { message: "Bookings retrieved successfully", pagination, req });
  };

  get = async (req: Request, res: Response) => {
    const { id } = BookingParamsDto.parse(req.params);
    SuccessResponseDto.send(res, { message: 'Booking retrieved successfully', data: await this.service.getAdminBooking(id), req });
  };

  approve = async (req: Request, res: Response) => {
    const { id } = BookingParamsDto.parse(req.params);
    SuccessResponseDto.send(res, { message: 'Booking approved', data: await this.service.approve(adminId(req), id, ApproveBookingDto.parse(req.body ?? {})), req });
  };

  reject = async (req: Request, res: Response) => {
    const { id } = BookingParamsDto.parse(req.params);
    SuccessResponseDto.send(res, { message: 'Booking rejected', data: await this.service.reject(adminId(req), id, RejectBookingDto.parse(req.body)), req });
  };

  resolveAmendment = async (req: Request, res: Response) => {
    const { id } = BookingParamsDto.parse(req.params);
    SuccessResponseDto.send(res, { message: 'Amendment resolved', data: await this.service.resolveAmendment(adminId(req), id, ResolveAmendmentDto.parse(req.body)), req });
  };

  cancel = async (req: Request, res: Response) => {
    const { id } = BookingParamsDto.parse(req.params);
    const data = await this.service.cancel({ kind: 'admin', userId: adminId(req) }, id, AdminCancelDto.parse(req.body));
    SuccessResponseDto.send(res, { message: 'Booking cancelled', data, req });
  };
}
