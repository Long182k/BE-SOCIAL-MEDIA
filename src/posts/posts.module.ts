import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import access_tokenJwtConfig from 'src/auth/@config/access_token-jwt.config';
import refresh_tokenJwtConfig from 'src/auth/@config/refresh_token-jwt.config';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { UserRepository } from 'src/users/users.repository';
import { InteractionsService } from './interactions.service';
import { CloudinaryService } from 'src/file/file.service';

@Module({
  imports: [
    JwtModule.registerAsync(access_tokenJwtConfig.asProvider()),
    ConfigModule.forFeature(access_tokenJwtConfig),
    ConfigModule.forFeature(refresh_tokenJwtConfig),
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    PrismaService,
    AuthService,
    JwtService,
    CloudinaryService,
    InteractionsService,
    UsersService,
    UserRepository,
  ],
})
export class PostsModule {}
