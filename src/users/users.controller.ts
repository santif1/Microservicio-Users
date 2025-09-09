import {
  Body,
  Controller,
  Get,
  Param,
  Query,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { LoginDTO } from '../interfaces/login.dto';
import { RegisterDTO } from '../interfaces/register.dto';
import { Request } from 'express';
import { JwtService} from 'src/jwt/jwt.service';
import { verify} from 'jsonwebtoken';
import { AuthGuard } from '../middlewares/auth.middleware';
import { RequestWithUser } from 'src/interfaces/request-user';
import { Put } from '@nestjs/common';
import { UpdateUserProfileDto } from 'src/interfaces/updateuser.dto'; 
import { Permissions } from 'src/middlewares/decorators/permissions.decorator';


@Controller()
export class UsersController {
  constructor(
    private service: UsersService, 
    private readonly jwtService: JwtService, 
   ) {}


  // Retorna todos los usuarios - protegido
  /*@UseGuards(AuthGuard)
  @Permissions('user_list')*/
  @Get('users')
  async findAll() {
  return this.service.findAll();
  }

  //Busca el perfil de un usuario (por su email) - protegido
  @UseGuards(AuthGuard)
  @Get('users/profile')
  async findOne(@Req() req) {
    return this.service.findByEmail(req.user.email);
  }

  //Gestiona el login de un usuario 
  @Post('users/login')
  login(@Body() body: LoginDTO) {
    return this.service.login(body);
  }

  //Gestiona el registro de un nuevo usuario
  @Post('users/register')
  register(@Body() body: RegisterDTO) {
    return this.service.register(body);
  }

  
  //Verifica el acceso a un recurso mediante los permisos del usuario
  @Get('can-do/:permission')
  canDo(
    @Req() request,
    @Param('permission') permission: string,
  ): Boolean {

    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException('Token faltante o malformado');
    
    const token = authHeader.split(' ')[1];

    let payload;

    try {
      payload = verify(token, 'authSecret'); 
    } catch (err) {
      throw new UnauthorizedException('Token inválido');
    }

    return this.service.canDo(payload.permissions, permission);
  }

  //Gestiona la renovación de un token - protegido
  @UseGuards(AuthGuard)
  @Post('users/refresh-token')
  refreshToken(@Req() request: Request) {

    const token = request.headers['refresh-token'];
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('No refresh token provided');
    }
    return this.jwtService.refreshToken(token);
  }


  //Asigna roles a un usuario
  @Post('users/:id/roles')
  assignRole(
    @Param('id') id: number,
    @Body() dto: { roleIds: number[]}
  ){
    return this.service.assignRole(id, dto.roleIds);
  }

  //Modifica los datos de un usuario
  @UseGuards(AuthGuard)
  @Put('users/profile')
  async updateProfile(
      @Req() request: RequestWithUser,
      @Body() updateProfileDto: UpdateUserProfileDto){

    //DEBUG
    console.log('Datos a actualizar:', updateProfileDto);
    console.log('request.user:', request.user);
    
    if (!request.user || !request.user.id) {
      throw new Error('Usuario no autenticado o ID faltante');
    }
    
    const userId = request.user.id;
    
    try {

      //Asigna la responsabilidad del cambio al service
      const updatedUser = await this.service.updateProfile(userId, updateProfileDto);

      console.log('Usuario actualizado:', { id: updatedUser.id, email: updatedUser.email }); //DEBUG
      
      // Si se cambió el email, generar un nuevo token
      if (updateProfileDto.email && updateProfileDto.email !== request.user.email) {
        
        const newToken = this.jwtService.generateToken({ 
          email: updatedUser.email, 
          sub: updatedUser.id,
          permissions: updatedUser.permissionCodes});
        
        console.log('Email cambiado, generando nuevo token'); //DEBUG
        
        //Retornar el usuario actualizado, el nuevo token y un mensaje de éxito 
        return {
          user: updatedUser,
          access_token: newToken,
          message: 'Perfil actualizado. Token renovado debido al cambio de email.'
        };
      }

      // Si no se cambió el email, devolver solo el usuario
      return updatedUser;
      
      //Manejo de errores
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw new Error('Error al actualizar perfil');
    }
  }



  //Endpoint para validar existencia de un mail
  @UseGuards(AuthGuard)
  @Get('check-email/:email')
  async checkEmailExists(
      @Param('email') email: string,
      @Query('excludeUserId') excludeUserId?: string
  ) {
    const excludeId = excludeUserId ? parseInt(excludeUserId) : undefined;
    return this.service.checkEmailExists(email, excludeId);
  }

}
