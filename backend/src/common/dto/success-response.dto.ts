import { Request, Response } from 'express';
import { ApiResponseDto } from './api-response.dto';
import { PaginationDto } from './pagination.dto';

export class SuccessResponseDto {
  static send<T>(
    res: Response,
    params: {
      message: string;
      data?: T;
      statusCode?: number;
      req?: Request;
    }
  ): Response {
    const requestId = params.req?.headers['x-request-id'] as string | undefined;

    const response = ApiResponseDto.success<T>({
      message: params.message,
      data: params.data,
      statusCode: params.statusCode ?? 200,
      requestId,
    });

    return res.status(response.statusCode).json(response);
  }

  static created<T>(
    res: Response,
    params: {
      message: string;
      data?: T;
      req?: Request;
    }
  ): Response {
    return SuccessResponseDto.send(res, {
      ...params,
      statusCode: 201,
    });
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static paginated<T>(
    res: Response,
    params: {
      message: string;
      pagination: PaginationDto<T>;
      req?: Request;
    }
  ): Response {
    const requestId = params.req?.headers['x-request-id'] as string | undefined;

    const response = ApiResponseDto.success({
      message: params.message,
      data: params.pagination,
      statusCode: 200,
      requestId,
    });

    return res.status(200).json(response);
  }
}