import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { createPermissionDto } from 'src/interfaces/createPermissionDto';
import { Permissions } from 'src/middlewares/decorators/permissions.decorator';
import { AuthGuard } from 'src/middlewares/auth.middleware';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {

    constructor(
        private readonly PermissionsService: PermissionsService
    ){}
    @UseGuards(AuthGuard)
    @Permissions('permissions_create')
    @Post()
    create(@Body() dto: createPermissionDto){
        return this.PermissionsService.create(dto);
    }

    @Get()
    findAll(){
        return this.PermissionsService.findAll();
    }

    @Get(':id')
    findOne(@Body('id') id:number){
        return this.PermissionsService.findOne(id);
    }
    @UseGuards(AuthGuard)
    @Permissions('delete_permissions')
    @Delete(':id')
    remove(@Param('id') id:number){
        return this.PermissionsService.remove(id);
    }
}
