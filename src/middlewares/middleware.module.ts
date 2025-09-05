import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.middleware';
import { JwtModule } from '../jwt/jwt.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule, JwtModule],
  providers: [AuthGuard],
  exports: [AuthGuard], 
})
export class MiddlewaresModule {}