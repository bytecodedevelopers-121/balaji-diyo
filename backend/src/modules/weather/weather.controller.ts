import { Request, Response } from 'express';
import { z } from 'zod';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { WeatherService } from './weather.service';

const paramsSchema = z.object({ packageId: z.string().min(1).max(100) });

export class WeatherController {
  constructor(private service: WeatherService) {}

  getPackageForecast = async (req: Request, res: Response) => {
    const { packageId } = paramsSchema.parse(req.params);
    const result = await this.service.getPackageForecast(packageId);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=1800');
    SuccessResponseDto.send(res, { message: 'Weather forecast retrieved successfully', data: result, req });
  };
}
