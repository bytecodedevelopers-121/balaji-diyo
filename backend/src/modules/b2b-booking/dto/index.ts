import { z } from 'zod';
import { dateInput, moneyInput } from '../../b2b-common/b2b-inputs';

const id = z.string().min(1).max(64);
const text = (max: number) => z.string().trim().max(max);

export const TravellerDto = z.object({
  fullName: z.string().trim().min(1).max(150),
  gender: text(20).optional(),
  email: z.string().trim().email().max(254),
  dateOfBirth: dateInput.optional(),
  nationality: z.string().trim().min(2).max(80),
  countryCode: z.string().trim().min(1).max(10),
  mobileNumber: text(30).optional(),
  passportNo: text(40).optional(),
  isLead: z.boolean().optional(),
});
export type TravellerDtoType = z.infer<typeof TravellerDto>;

export const CustomTravellerDto = TravellerDto.extend({ gender: z.string().trim().min(1).max(20) });

const travellerList = z.array(TravellerDto).min(1).max(500);
const FundingEnum = z.enum(['WALLET', 'CREDIT', 'WALLET_THEN_CREDIT']);
const MarkupModeEnum = z.enum(['PER_PAX', 'TOTAL']);

export const InstantBookingDto = z
  .object({
    holdId: id.optional(),
    departureId: id.optional(),
    paxCount: z.number().int().min(1).max(500).optional(),
    travellers: travellerList,
    agentMarkup: moneyInput.optional(),
    agentMarkupMode: MarkupModeEnum.default('TOTAL'),
    fundingMethod: FundingEnum.default('WALLET'),
    pickupDetails: text(500).optional(),
  })
  .refine((v) => (v.holdId ? !v.departureId && v.paxCount === undefined : !!v.departureId && v.paxCount !== undefined), {
    message: 'Provide either holdId, or departureId together with paxCount',
  });
export type InstantBookingDtoType = z.infer<typeof InstantBookingDto>;

export const OnRequestBookingDto = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('DEPARTURE'),
    departureId: id,
    paxCount: z.number().int().min(1).max(500),
    travellers: travellerList,
    agentMarkup: moneyInput.optional(),
    agentMarkupMode: MarkupModeEnum.default('TOTAL'),
    fundingMethod: FundingEnum.default('WALLET'),
    pickupDetails: text(500).optional(),
    specialRequirement: text(2000).optional(),
  }),
  z.object({
    kind: z.literal('CUSTOM'),
    packageId: id,
    startDate: dateInput,
    endDate: dateInput.optional(),
    travellers: z.array(CustomTravellerDto).min(1).max(500),
    arrivalDate: dateInput.optional(),
    arrivalFlightNo: text(40).optional(),
    airportPickup: z.boolean().default(false),
    departureDate: dateInput.optional(),
    departureFlightNo: text(40).optional(),
    airportDropoff: z.boolean().default(false),
    travelInsurance: z.boolean().default(false),
    specialRequirement: text(2000).optional(),
    fundingMethod: FundingEnum.default('WALLET'),
  }),
]);
export type OnRequestBookingDtoType = z.infer<typeof OnRequestBookingDto>;

export const CancelBookingDto = z.object({ reason: text(1000).optional() });
export type CancelBookingDtoType = z.infer<typeof CancelBookingDto>;

export const AmendBookingDto = z.object({
  reason: z.string().trim().min(3).max(1000),
  changes: z
    .object({
      paxCount: z.number().int().min(1).max(500).optional(),
      departureId: id.optional(),
      travellers: travellerList.optional(),
    })
    .refine((c) => c.paxCount !== undefined || c.departureId !== undefined || c.travellers !== undefined, { message: 'Provide at least one change' }),
});
export type AmendBookingDtoType = z.infer<typeof AmendBookingDto>;

export const ListBookingsQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
  kind: z.enum(['BOOKING', 'CUSTOM']).default('BOOKING'),
  status: z.enum(['DRAFT', 'HELD', 'PENDING_APPROVAL', 'CONFIRMED', 'AMENDMENT_REQUESTED', 'CANCELLED', 'EXPIRED']).optional(),
  partnerId: id.optional(), // admin only; ignored for partner calls
  q: text(100).optional(),
});
export type ListBookingsQueryDtoType = z.infer<typeof ListBookingsQueryDto>;

export const BookingParamsDto = z.object({ id });

export const ApproveBookingDto = z.object({
  note: text(1000).optional(),
  // Custom itineraries have no catalog price: the agreed net amount is set here.
  netPayable: moneyInput.refine((d) => d.gt(0), 'netPayable must be greater than zero').optional(),
  fundingMethod: FundingEnum.optional(),
});
export type ApproveBookingDtoType = z.infer<typeof ApproveBookingDto>;

export const RejectBookingDto = z.object({ reason: z.string().trim().min(3).max(1000) });
export type RejectBookingDtoType = z.infer<typeof RejectBookingDto>;

export const ResolveAmendmentDto = z.object({ action: z.enum(['APPROVE', 'REJECT']), note: text(1000).optional() });
export type ResolveAmendmentDtoType = z.infer<typeof ResolveAmendmentDto>;

export const AdminCancelDto = z.object({
  reason: z.string().trim().min(3).max(1000),
  // Explicit override of the schedule-based penalty (0 = full refund).
  penaltyAmount: moneyInput.optional(),
});
export type AdminCancelDtoType = z.infer<typeof AdminCancelDto>;
