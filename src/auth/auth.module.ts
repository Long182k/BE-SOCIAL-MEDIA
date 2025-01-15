import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from 'src/auth/@strategies/jwt.strategy';
import { LocalStrategy } from './@strategies/local.strategy';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './@config/access_token-jwt.config';
import refreshJwtConfig from './@config/refresh_token-jwt.config';

import 'dotenv/config';
import { RefreshJwtStrategy } from './@strategies/refresh-jwt.strategy';
import { UserRepository } from 'src/users/users.repository';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshJwtStrategy,
    UserRepository,
    PrismaService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
