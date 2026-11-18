import { Request, Response } from 'express';
import { PageSectionService } from './page-section.service';
import { SaveSectionDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class PageSectionController {
  constructor(private service: PageSectionService) {}

  getPublic = async (req: Request, res: Response) =>
    SuccessResponseDto.send(res, {
      message: 'Page sections retrieved successfully',
      data: await this.service.getPublic(req.params.pageKey as string),
      req,
    });

  listPages = async (req: Request, res: Response) =>
    SuccessResponseDto.send(res, { message: 'Pages retrieved successfully', data: await this.service.listPages(), req });

  getAdmin = async (req: Request, res: Response) =>
    SuccessResponseDto.send(res, {
      message: 'Page sections retrieved successfully',
      data: await this.service.getAdmin(req.params.pageKey as string),
      req,
    });

  save = async (req: Request, res: Response) =>
    SuccessResponseDto.send(res, {
      message: 'Section saved successfully',
      data: await this.service.save(req.params.pageKey as string, req.params.sectionKey as string, SaveSectionDto.parse(req.body)),
      req,
    });
}
