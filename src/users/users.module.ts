import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '../jwt/jwt.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtModule } from 'src/jwt/jwt.module';
import { UserEntity } from 'src/entities/user.entity';
import { RoleEntity } from 'src/entities/roles.entity';



@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RoleEntity]),
    JwtModule
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtService],
  exports: [UsersService]
})
export class UsersModule {}
