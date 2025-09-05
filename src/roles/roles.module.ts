import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/entities';  
import { JwtService } from 'src/jwt/jwt.service';
import { UsersModule } from 'src/users/users.module';


@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    UsersModule
  ],
  controllers: [RolesController],
  providers: [RolesService, JwtService],
  exports: [RolesService] 
})
export class RolesModule {}
