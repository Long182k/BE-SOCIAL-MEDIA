import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import access_tokenJwtConfig from 'src/auth/@config/access_token-jwt.config';
import refresh_tokenJwtConfig from 'src/auth/@config/refresh_token-jwt.config';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma.service';
import { UsersController } from './users.controller';
import { UserRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [
    JwtModule.registerAsync(access_tokenJwtConfig.asProvider()),
    ConfigModule.forFeature(access_tokenJwtConfig),
    ConfigModule.forFeature(refresh_tokenJwtConfig),
  ],
  controllers: [UsersController],
  providers: [
    UserRepository,
    UsersService,
    PrismaService,
    AuthService,
    JwtService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
