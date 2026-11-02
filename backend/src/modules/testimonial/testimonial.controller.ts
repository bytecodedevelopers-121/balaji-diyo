import { Request, Response } from 'express';
import { TestimonialService } from './testimonial.service';
import { CreateTestimonialDto, UpdateTestimonialDto, GetTestimonialsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class TestimonialController {
  constructor(private service: TestimonialService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateTestimonialDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Testimonial created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetTestimonialsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Testimonials retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Testimonial retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateTestimonialDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Testimonial updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Testimonial deleted successfully', req });
  };
}
