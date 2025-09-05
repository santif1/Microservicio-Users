import { Injectable, UnauthorizedException } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import * as dayjs from 'dayjs';
import { Payload } from 'src/interfaces/payload';


@Injectable()
export class JwtService {
  constructor() {
    
  }

  // Configuración local del servicio
  config = {
    auth: {
      secret: 'authSecret',        // Secreto para firmar el token de acceso
      expiresIn: '15m',            // Tiempo de vida del token de acceso
    },
    refresh: {
      secret: 'refreshSecret',     // Secreto para firmar el token de refresh
      expiresIn: '1d',             // Tiempo de vida del token de refresh
    },
  };
   
  //Genera un token JWT con un payload y un tipo (auth o refresh).
  generateToken(
    
    payload: { 
      email: string; 
      sub: number;
      permissions: string[];
    }, //Contiene al menos el email y el ID (sub) del usuario.
    //Define el tipo de token: 'auth' o 'refresh'. Por defecto es 'auth'.
    type: 'refresh' | 'auth' = 'auth',
  ): string {
    //Retorna un string JWT firmado.
    return sign(payload, this.config[type].secret, {
      expiresIn: this.config[type].expiresIn,
    });
  }

  /**
   * Valida un token de refresh y genera un nuevo accessToken.
   * Si el refreshToken está por expirar (menos de 20 minutos), se genera uno nuevo.
   * refreshToken - Token de refresh JWT enviado por el cliente.
   * Retorna un nuevo par de accessToken y refreshToken (si era necesario regenerarlo).
   */
  refreshToken(refreshToken: string): { accessToken: string; refreshToken: string } {
    try {
      // Verifica el token y extrae el payload
      const payload = this.getPayload(refreshToken, 'refresh');

      // Calcula cuántos minutos faltan para que expire
      const timeToExpire = dayjs.unix(payload.exp).diff(dayjs(), 'minute');

      return {
        accessToken: this.generateToken({ email: payload.email, sub: payload.sub, permissions: payload.permissions }, 'auth'),

        // Si le quedan menos de 20 minutos, se renueva el refreshToken también
        refreshToken:
          timeToExpire < 20
            ? this.generateToken({ email: payload.email, sub: payload.sub, permissions: payload.permissions }, 'refresh')
            : refreshToken
      };
    } catch (error) {
      // Si falla la verificación, lanza excepción de no autorizado
      throw new UnauthorizedException();
    }
  }


  //Verifica un JWT y devuelve su contenido (payload).
  getPayload(token: string, type: 'refresh' | 'auth' = 'auth'): Payload {
    //token - JWT recibido.
    //type - Tipo de token: 'auth' o 'refresh'.
    
    return verify(token, this.config[type].secret); // Verifica y decodifica el token con el secreto correspondiente
  }
}