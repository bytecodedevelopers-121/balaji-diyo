import { Request, Response } from 'express';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto, GetRolesDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class RoleController {
    constructor(private service: RoleService) { }

    create = async (req: Request, res: Response) => {
        const dto = CreateRoleDto.parse(req.body);
        const result = await this.service.create(dto);

        SuccessResponseDto.created(res, {
            message: 'Role created successfully',
            data: result,
            req,
        });
    };

    findAll = async (req: Request, res: Response) => {
        const dto = GetRolesDto.parse(req.query);
        const result = await this.service.findAll(dto);

        SuccessResponseDto.send(res, {
            message: 'Roles retrieved successfully',
            data: result,
            req,
        });
    };

    findById = async (req: Request, res: Response) => {
        const result = await this.service.findById(req.params.id as string);

        SuccessResponseDto.send(res, {
            message: 'Role retrieved successfully',
            data: result,
            req,
        });
    };

    update = async (req: Request, res: Response) => {
        const dto = UpdateRoleDto.parse(req.body);
        const result = await this.service.update(req.params.id as string, dto);

        SuccessResponseDto.send(res, {
            message: 'Role updated successfully',
            data: result,
            req,
        });
    };

    getPermissions = async (req: Request, res: Response) => {
        const result = await this.service.findAllPermissions();

        SuccessResponseDto.send(res, {
            message: 'Permissions retrieved successfully',
            data: result,
            req,
        });
    };
}