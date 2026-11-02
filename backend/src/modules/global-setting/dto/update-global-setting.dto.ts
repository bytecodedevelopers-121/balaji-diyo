import { z } from 'zod';
import { GlobalSettingBaseDto } from './create-global-setting.dto';

export const UpdateGlobalSettingDto = GlobalSettingBaseDto.partial();

export type UpdateGlobalSettingDtoType = z.infer<typeof UpdateGlobalSettingDto>;
