import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { entities } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from 'src/jwt/jwt.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    JwtModule,
    UsersModule
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService, JwtModule],
  exports: [PermissionsService]
})
export class PermissionsModule {}
