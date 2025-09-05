import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { RequestWithUser } from 'src/interfaces/request-user';
import { JwtService } from '../jwt/jwt.service';
import { UsersService } from 'src/users/users.service';
import { PERMISSIONS_KEY } from './decorators/permissions.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService, // Servicio para decodificar el JWT
    private usersService: UsersService, // Servicio para buscar al usuario en la base
    private reflector: Reflector // Utilidad para leer metadatos en tiempo de ejecución
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Obtiene el objeto Request del contexto de ejecución
      const request: RequestWithUser = context.switchToHttp().getRequest();

      // Obtiene la cabecera 'Authorization'
      const authHeader = request.headers.authorization;

      // Si no hay token, lanza excepción
      if (!authHeader) throw new UnauthorizedException('No hay token');

      // Elimina el prefijo "Bearer " del token
      const token = request.headers.authorization.replace('Bearer ', '');

      if (!token) throw new UnauthorizedException('El token no existe');

      // Decodifica el token y obtiene el payload (datos del usuario)
      const payload = this.jwtService.getPayload(token);

      // Busca al usuario en base al email contenido en el token
      const user = await this.usersService.findByEmail(payload.email);

      // Si no se encuentra al usuario, lanza excepción
      if (!user) throw new UnauthorizedException('Usuario no encontrado');

      // Inyecta el usuario en el objeto request (para que el controlador lo pueda usar)
      request.user = user;

      // Obtiene los permisos requeridos desde los metadatos del handler
      const permissions = this.reflector.get<string[]>(
        PERMISSIONS_KEY,
        context.getHandler(), // El handler (método del controlador) actual
      );

      // Si no se definieron permisos, permite el acceso
      if (!permissions || permissions.length === 0) return true;

      // Verifica que el usuario tenga cada uno de los permisos requeridos
      for (const permission of permissions) {
        this.usersService.canDo(permissions, permission); // Puede lanzar excepción si no puede
      }

      // Si pasó todas las validaciones, permite el acceso
      return true;

    } catch (error) {
      // Muestra el error en consola y lanza excepción de no autorizado
      throw new UnauthorizedException(error?.message);
    }
  }
}
