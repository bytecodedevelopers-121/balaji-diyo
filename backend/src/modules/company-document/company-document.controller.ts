import { Request, Response } from 'express';
import { CompanyDocumentService } from './company-document.service';
import { CreateCompanyDocumentDto, UpdateCompanyDocumentDto, GetCompanyDocumentsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class CompanyDocumentController {
  constructor(private service: CompanyDocumentService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateCompanyDocumentDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Company document created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetCompanyDocumentsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Company documents retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Company document retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateCompanyDocumentDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Company document updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Company document deleted successfully', req });
  };
}
