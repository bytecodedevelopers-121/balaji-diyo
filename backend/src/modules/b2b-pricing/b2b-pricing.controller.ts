import { Request, Response } from 'express';
import { B2BPricingService } from './b2b-pricing.service';
import { QuoteDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { partnerScope } from '../../common/guards/b2b.guard';

export class B2BPricingController {
  constructor(private service: B2BPricingService) {}

  quote = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const data = await this.service.quote(partnerId, QuoteDto.parse(req.body));
    SuccessResponseDto.send(res, { message: 'Quote calculated', data, req });
  };
}
