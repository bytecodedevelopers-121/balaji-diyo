import { prisma, queryAll, bool, nullIfEmpty } from '../db';
import { idMap } from '../id-map';
import { report } from '../report';
import { toJsonOrWrap } from '../utils';

interface BookingRow {
  id: number;
  trip_id: number;
  start_date: Date;
  end_date: Date;
  number_of_traveller: number;
  full_name: string;
  email: string;
  date_of_birth: Date | null;
  nationality: string | null;
  country_code: string | null;
  mobile_number: string | null;
  pickup_details: string | null;
  payment_options: string | null;
  total_price: number;
  payable_percentage: number;
  arrival_date: Date | null;
  arrival_flight_no: string | null;
  airport_pickup: number;
  departure_date: Date | null;
  departure_flight_no: string | null;
  airport_dropoff: number;
  travel_insurance: number;
  is_custom: number;
  ip_address: string | null;
}

// travel_package_custom_bookings + both traveller tables are empty in this
// dump (confirmed) — travel_package_bookings.is_custom already distinguishes
// normal vs. custom bookings in one table, and no traveller rows exist to
// migrate either way.
export async function importBookingsAndPayments(): Promise<void> {
  const bookings = await queryAll<BookingRow>('SELECT * FROM travel_package_bookings');
  let bookingCount = 0;
  let customBookingCount = 0;
  for (const row of bookings) {
    const packageId = idMap.get('package', row.trip_id);
    if (row.is_custom) {
      if (!packageId) {
        console.warn(`  travel_package_bookings#${row.id}: unknown trip_id ${row.trip_id}, skipped`);
        continue;
      }
      await prisma.customBooking.create({
        data: {
          packageId,
          startDate: row.start_date,
          endDate: row.end_date,
          numberOfTraveller: row.number_of_traveller,
          arrivalDate: row.arrival_date,
          arrivalFlightNo: nullIfEmpty(row.arrival_flight_no),
          airportPickup: bool(row.airport_pickup),
          departureDate: row.departure_date,
          departureFlightNo: nullIfEmpty(row.departure_flight_no),
          airportDropoff: bool(row.airport_dropoff),
          travelInsurance: bool(row.travel_insurance),
          ipAddress: nullIfEmpty(row.ip_address),
        },
      });
      customBookingCount++;
    } else {
      await prisma.booking.create({
        data: {
          packageId: packageId ?? null,
          startDate: row.start_date,
          endDate: row.end_date,
          numberOfTraveller: row.number_of_traveller,
          fullName: row.full_name,
          email: row.email,
          dateOfBirth: row.date_of_birth,
          nationality: row.nationality ?? '',
          countryCode: row.country_code ?? '',
          mobileNumber: nullIfEmpty(row.mobile_number),
          pickupDetails: nullIfEmpty(row.pickup_details),
          paymentOptions: row.payment_options ?? '',
          totalPrice: row.total_price,
          payablePercentage: row.payable_percentage ? Math.round(row.payable_percentage) : null,
          ipAddress: nullIfEmpty(row.ip_address),
        },
      });
      bookingCount++;
    }
  }
  report.record('travel_package_bookings', bookings.length, bookingCount + customBookingCount);
  report.skip('travel_package_custom_bookings', 0, 'no legacy rows (is_custom flag on travel_package_bookings covers both cases)');
  report.skip('travel_package_booking_travellers', 0, 'no legacy rows');
  report.skip('travel_package_custom_booking_travellers', 0, 'no legacy rows');
  report.skip('travel_package_booking_invoices', 0, 'no legacy rows');

  await importPayments();
  await importContactMessages();
}

const HBL_STATUS_MAP: Record<string, string> = {
  PENDING: 'PENDING',
  APPROVED: 'SUCCESS',
  DECLINED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

interface HblPaymentRow {
  id: number;
  booking_id: number | null;
  package_id: number | null;
  custom_title: string | null;
  customer_name: string;
  customer_email: string;
  description: string | null;
  hbl_order_id: string | null;
  hbl_pay_status: string;
  hbl_percentage: number;
  hbl_total_amount: number;
  execute_jose_payload: string | null;
  execute_jose_response: string | null;
  hbl_controller_internal_id: string | null;
}

async function importPayments(): Promise<void> {
  // Legacy table name is "hbl" but the code path it actually serves
  // (PaymentController::hblPayment / SecurityData.php's hardcoded PACO base
  // URL) is the PACO/2c2p gateway — see [[boundless-backend-status]]. Migrated
  // as gateway: PACO, not HBL. The 3 other legacy payment tables are empty.
  const rows = await queryAll<HblPaymentRow>('SELECT * FROM travel_payment_hbl');
  let count = 0;
  for (const row of rows) {
    await prisma.payment.create({
      data: {
        gateway: 'PACO',
        packageId: row.package_id ? idMap.get('package', row.package_id) ?? null : null,
        customTitle: nullIfEmpty(row.custom_title),
        customerName: nullIfEmpty(row.customer_name),
        customerEmail: nullIfEmpty(row.customer_email),
        description: nullIfEmpty(row.description),
        percentage: row.hbl_percentage ? Math.round(row.hbl_percentage) : null,
        totalAmount: row.hbl_total_amount,
        status: (HBL_STATUS_MAP[row.hbl_pay_status] ?? 'PENDING') as never,
        gatewayReference: nullIfEmpty(row.hbl_order_id),
        // execute_jose_payload/response are opaque JOSE compact tokens, not
        // JSON — wrapped rather than parsed. hbl_controller_internal_id has no
        // matching field on the shared Payment shape, folded into the
        // response blob instead of dropped.
        requestPayload: toJsonOrWrap(row.execute_jose_payload) as never,
        responsePayload: {
          raw: row.execute_jose_response ?? null,
          controllerInternalId: row.hbl_controller_internal_id ?? null,
        } as never,
      },
    });
    count++;
  }
  report.record('travel_payment_hbl', rows.length, count);
  report.skip('travel_payment_nabil', 0, 'no legacy rows');
  report.skip('travel_payment_nica', 0, 'no legacy rows');
  report.skip('travel_payments', 0, 'no legacy rows');
}

interface ContactMessageRow {
  id: number;
  name: string;
  email: string;
  type: string;
  url: string;
  phone_no: string | null;
  message: string;
  trip_id: number | null;
  number_of_traveller: number | null;
  ip_address: string | null;
}

async function importContactMessages(): Promise<void> {
  const rows = await queryAll<ContactMessageRow>('SELECT * FROM base_contact_messages');
  let count = 0;
  for (const row of rows) {
    await prisma.contactMessage.create({
      data: {
        name: row.name,
        email: row.email,
        type: row.type,
        url: row.url,
        phone: nullIfEmpty(row.phone_no),
        message: row.message,
        packageId: row.trip_id ? idMap.get('package', row.trip_id) ?? null : null,
        numberOfTraveller: row.number_of_traveller,
        ipAddress: nullIfEmpty(row.ip_address),
      },
    });
    count++;
  }
  report.record('base_contact_messages', rows.length, count);
}
