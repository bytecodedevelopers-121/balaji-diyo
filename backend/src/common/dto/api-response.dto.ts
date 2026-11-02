export type ApiStatus = 'success' | 'error';

export class ApiResponseDto<T = unknown> {
    status: ApiStatus;
    statusCode: number;
    message: string;
    data: T | null;
    timestamp: string;
    requestId?: string;

    constructor(params: {
        status: ApiStatus;
        statusCode: number;
        message: string;
        data?: T | null;
        requestId?: string;
    }) {
        this.status = params.status;
        this.statusCode = params.statusCode;
        this.message = params.message;
        this.data = params.data ?? null;
        this.timestamp = new Date().toISOString();
        this.requestId = params.requestId;
    }

    static success<T>(params: {
        message: string;
        data?: T;
        statusCode?: number;
        requestId?: string;
    }): ApiResponseDto<T> {
        return new ApiResponseDto<T>({
            status: 'success',
            statusCode: params.statusCode ?? 200,
            message: params.message,
            data: params.data,
            requestId: params.requestId,
        });
    }

    static error(params: {
        message: string;
        statusCode?: number;
        requestId?: string;
    }): ApiResponseDto<null> {
        return new ApiResponseDto<null>({
            status: 'error',
            statusCode: params.statusCode ?? 500,
            message: params.message,
            data: null,
            requestId: params.requestId,
        });
    }
}