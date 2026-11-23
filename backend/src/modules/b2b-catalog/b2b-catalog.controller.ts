import { Request, Response } from 'express';
import { B2BCatalogService } from './b2b-catalog.service';
import { ListCatalogQueryDto, CatalogParamsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { partnerScope } from '../../common/guards/b2b.guard';

export class B2BCatalogController {
  constructor(private service: B2BCatalogService) {}

  list = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const pagination = await this.service.list(partnerId, ListCatalogQueryDto.parse(req.query));
    SuccessResponseDto.paginated(res, { message: 'Packages retrieved successfully', pagination, req });
  };

  detail = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const { id } = CatalogParamsDto.parse(req.params);
    SuccessResponseDto.send(res, { message: 'Package retrieved successfully', data: await this.service.detail(partnerId, id), req });
  };
}
