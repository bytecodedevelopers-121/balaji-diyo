import { randomUUID } from 'node:crypto';
import { pacoConfigFor, type PacoConfig, type PacoCurrency } from '../../../config/paco';
import { signAndEncrypt, decryptAndVerify } from './paco.crypto';
import { ApiError } from '../../../common/exceptions/api-error';

export interface InitiateCheckoutParams {
  orderNo: string;
  amount: number;
  currency: PacoCurrency;
  description: string;
  customerName: string;
  customerEmail: string;
  percentage?: number;
  successUrl: string;
  failedUrl: string;
  cancelUrl: string;
  backendUrl: string;
}

export interface InitiateCheckoutResult {
  orderNo: string;
  controllerInternalId: string | null;
  paymentPageUrl: string;
  rawResponse: unknown;
}

interface PacoResponseShape {
  response?: {
    Data?: {
      paymentIncompleteResult?: { orderNo?: string; controllerInternalID?: string };
      paymentPage?: { paymentPageURL?: string };
    };
  };
}

// Mirrors flamingo-base's App\Lib\Api\Payment::ExecuteFormJose() request shape
// field-for-field (names, nesting, the "N"/"CC"/"ECOM" literals) — see the
// PACO research notes in memory for the source reference. Charged in NPR
// (each currency has its own PACO access token); decimalPlaces stays 2.
export class PacoRejectedError extends ApiError {
  constructor(public httpStatus: number, public detail: string) {
    super(502, `PACO payment gateway returned ${httpStatus}`);
  }
}

export class PacoClient {
  async initiateCheckout(params: InitiateCheckoutParams): Promise<InitiateCheckoutResult> {
    // Each currency has its own PACO credential set.
    const config: PacoConfig = pacoConfigFor(params.currency);
    const accessToken = config.accessToken;
    const now = new Date();
    const iat = Math.floor(now.getTime() / 1000);

    const request = {
      apiRequest: {
        requestMessageID: randomUUID(),
        requestDateTime: now.toISOString(),
        language: 'en-US',
      },
      officeId: config.merchantId,
      orderNo: params.orderNo,
      productDescription: params.description,
      paymentType: 'CC',
      paymentCategory: 'ECOM',
      storeCardDetails: { storeCardFlag: 'N', storedCardUniqueID: '{{guid}}' },
      installmentPaymentDetails: { ippFlag: 'N', installmentPeriod: 0, interestType: null },
      mcpFlag: 'N',
      request3dsFlag: 'Y',
      transactionAmount: {
        amountText: String(Math.round(params.amount * 100)).padStart(12, '0'),
        currencyCode: params.currency,
        decimalPlaces: 2,
        amount: params.amount,
      },
      notificationURLs: {
        confirmationURL: params.successUrl,
        failedURL: params.failedUrl,
        cancellationURL: params.cancelUrl,
        backendURL: params.backendUrl,
      },
      // PACO rejects the whole request ("Invalid custom fields with empty,
      // duplicate or incorrect custom field name" — confirmed live) if any
      // custom field's value is empty, so `Percentage` is only included
      // when the caller actually provided one, not sent as `''`.
      customFieldList: [
        { fieldName: 'Name', fieldValue: params.customerName },
        { fieldName: 'Email', fieldValue: params.customerEmail },
        { fieldName: 'Trip', fieldValue: params.description },
        ...(params.percentage != null ? [{ fieldName: 'Percentage', fieldValue: String(params.percentage) }] : []),
      ],
    };

    const payload = {
      request,
      iss: accessToken,
      aud: 'PacoAudience',
      CompanyApiKey: accessToken,
      iat,
      nbf: iat,
      exp: iat + 3600,
    };

    const requestToken = await signAndEncrypt(payload, config);

    let responseBody: string;
    let httpOk: boolean;
    let httpStatus: number;
    try {
      const res = await fetch(new URL('api/1.0/Payment/prePaymentUi', config.apiBaseUrl), {
        method: 'POST',
        headers: {
          Accept: 'application/jose',
          CompanyApiKey: accessToken,
          'Content-Type': 'application/jose; charset=utf-8',
        },
        body: requestToken,
      });
      responseBody = await res.text();
      httpOk = res.ok;
      httpStatus = res.status;
    } catch {
      throw new ApiError(502, 'Failed to reach PACO payment gateway');
    }

    if (!httpOk) {
      // Server-side diagnostic only — never surfaced to the API caller
      // (this backend's "never expose raw errors" rule). PACO's error
      // responses are sometimes still JOSE-encrypted, sometimes plain
      // text/JSON depending on how early the request was rejected — best
      // effort decrypt, fall back to the raw body if that fails too.
      let detail = responseBody;
      try {
        detail = JSON.stringify(await decryptAndVerify(responseBody, config));
      } catch {
        // not a JOSE-encrypted error body — log the raw text as-is
      }
      console.error('PacoClient.initiateCheckout: non-OK response', { httpStatus, detail });
      throw new PacoRejectedError(httpStatus, detail);
    }

    const decoded = (await decryptAndVerify(responseBody, config)) as PacoResponseShape;
    const data = decoded.response?.Data;
    const paymentPageUrl = data?.paymentPage?.paymentPageURL;
    if (!paymentPageUrl) {
      throw new ApiError(502, 'PACO payment gateway response missing payment page URL');
    }

    return {
      orderNo: data?.paymentIncompleteResult?.orderNo ?? params.orderNo,
      controllerInternalId: data?.paymentIncompleteResult?.controllerInternalID ?? null,
      paymentPageUrl,
      rawResponse: decoded,
    };
  }
}
