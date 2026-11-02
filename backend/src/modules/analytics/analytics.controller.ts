import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { GetAnalyticsDashboardDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  getDashboard = async (req: Request, res: Response) => {
    const { range } = GetAnalyticsDashboardDto.parse(req.query);
    const result = await this.service.getDashboard(range);

    SuccessResponseDto.send(res, {
      message: 'Analytics dashboard retrieved successfully',
      data: result,
      req,
    });
  };
}
