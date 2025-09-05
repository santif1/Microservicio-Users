import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './entities';
import { UsersController } from './users/users.controller';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { UsersModule } from './users/users.module';
import { MiddlewaresModule } from './middlewares/middleware.module';
import { JwtModule } from './jwt/jwt.module';
import { SeedService } from './users/seed.service';
import { JwtService } from './jwt/jwt.service';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '127.0.0.1',
      port: 5434,
      database: 'users',
      username: 'postgres',
      password: 'postgres',
      synchronize: false,
      dropSchema: false,
      entities,
    }),
    TypeOrmModule.forFeature(entities),
    RolesModule,
    PermissionsModule,
    UsersModule,
    MiddlewaresModule,
    JwtModule,

  ],
  controllers: [AppController, UsersController],
  providers: [
    SeedService, JwtService
  ]
})
export class AppModule {}
