import { Request, Response } from 'express';
import { B2BContractService } from './b2b-contract.service';
import { CreateContractDto, UpdateContractDto, ListContractsQueryDto, ContractParamsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { ApiError } from '../../common/exceptions/api-error';

const adminId = (req: Request): string => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  return req.user.userId;
};

export class B2BContractController {
  constructor(private service: B2BContractService) {}

  list = async (req: Request, res: Response) => {
    const pagination = await this.service.list(ListContractsQueryDto.parse(req.query));
    SuccessResponseDto.paginated(res, { message: 'Contracts retrieved successfully', pagination, req });
  };

  create = async (req: Request, res: Response) => {
    const data = await this.service.create(adminId(req), CreateContractDto.parse(req.body));
    SuccessResponseDto.created(res, { message: 'Contract created', data, req });
  };

  update = async (req: Request, res: Response) => {
    const { id } = ContractParamsDto.parse(req.params);
    const data = await this.service.update(id, adminId(req), UpdateContractDto.parse(req.body));
    SuccessResponseDto.send(res, { message: 'Contract updated', data, req });
  };
}
