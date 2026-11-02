import { Request, Response } from 'express';
import { GlobalSettingService } from './global-setting.service';
import { CreateGlobalSettingDto, UpdateGlobalSettingDto, GetGlobalSettingsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { toAbsolutePublicFileUrl } from '../../lib/media';

// IMAGE settings store a raw storage path (see GlobalSettingFormDrawer's own
// comment on the frontend-admin side) — same "resolve to an absolute URL
// right before the response goes out" shape as `withAbsoluteImageField`
// elsewhere, just keyed by `valueType` instead of a fixed field name since
// a public settings response mixes value types in one payload.
const resolvePublicValue = (req: Request, valueType: string, resolvedValue: unknown) =>
  valueType === 'IMAGE' && typeof resolvedValue === 'string'
    ? toAbsolutePublicFileUrl(req, resolvedValue)
    : resolvedValue;

export class GlobalSettingController {
  constructor(private service: GlobalSettingService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateGlobalSettingDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Setting created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetGlobalSettingsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Settings retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Setting retrieved successfully', data: result, req });
  };

  findPublicByKey = async (req: Request, res: Response) => {
    const result = await this.service.findPublicByKey(req.params.key as string);
    const data = { ...result, resolvedValue: resolvePublicValue(req, result.valueType, result.resolvedValue) };

    SuccessResponseDto.send(res, { message: 'Setting retrieved successfully', data, req });
  };

  // Flat `{ key: resolvedValue }` map of every active setting — the shape
  // Header/Footer/etc. actually want (`settings.phone`, `settings.logo_light`),
  // not an array to search through.
  findAllPublic = async (req: Request, res: Response) => {
    const settings = await this.service.findAllPublic();
    const data = Object.fromEntries(
      settings.map(({ key, valueType, resolvedValue }) => [key, resolvePublicValue(req, valueType, resolvedValue)]),
    );

    SuccessResponseDto.send(res, { message: 'Settings retrieved successfully', data, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateGlobalSettingDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Setting updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Setting deleted successfully', req });
  };
}
