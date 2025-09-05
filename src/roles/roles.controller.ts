import { Controller, Post, Get, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { createRoleDto } from 'src/interfaces/createRoleDto';
import { Permissions } from 'src/middlewares/decorators/permissions.decorator';
import { AuthGuard } from 'src/middlewares/auth.middleware'
 

// Controlador que maneja las rutas relacionadas con roles
@Controller('roles')
export class RolesController {

  // Inyecta el servicio de roles para usarlo en los métodos del controlador
  constructor(private readonly RolesService: RolesService) {}

  // Ruta: POST /roles
  // Protegida por AuthGuard (requiere autenticación)
  // Requiere permiso "create_roles"
  // Crea un nuevo rol con los datos del DTO recibido en el body
  @UseGuards(AuthGuard)
  @Permissions('create_roles')
  @Post()
  createRole(@Body() dto: createRoleDto) {
    return this.RolesService.create(dto);
  }

  // Ruta: GET /roles
  // Protegida por AuthGuard (requiere autenticación)
  // Requiere permiso "roles_list"
  // Devuelve la lista de todos los roles existentes
  @UseGuards(AuthGuard)
  @Permissions('roles_list')
  @Get()
  findAll() {
    return this.RolesService.findAll();
  }

  // Ruta: GET /roles/:id
  // Protegida por AuthGuard (requiere autenticación)
  // Requiere permiso "roles_list"
  // Busca y devuelve un rol específico por su ID
  @UseGuards(AuthGuard)
  @Permissions('roles_list')
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.RolesService.findOne(id);
  }

  // Ruta: POST /roles/:id/permissions
  // Protegida por AuthGuard (requiere autenticación)
  // Requiere permiso "add_permissions"
  // Agrega una lista de permisos al rol con ID especificado
  @UseGuards(AuthGuard)
  @Permissions('add_permissions')
  @Post(':id/permissions')
  addPermissions(
    @Param('id') id: number,
    @Body() dto: { permissionIds: number[] } // Recibe un array de IDs de permisos
  ) {
    return this.RolesService.addPermissions(id, dto.permissionIds);
  }

  // Ruta: DELETE /roles/:id
  // Protegida por AuthGuard (requiere autenticación)
  // Requiere permiso "remove_roles"
  // Elimina el rol con el ID especificado
  @UseGuards(AuthGuard)
  @Permissions('remove_roles')
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.RolesService.remove(id);
  }
}
