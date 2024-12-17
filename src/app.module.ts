import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/@guard/jwt-auth.guard';
import { PrismaService } from './prisma.service';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import access_tokenJwtConfig from './auth/@config/access_token-jwt.config';
import { ConfigModule } from '@nestjs/config';
import refresh_tokenJwtConfig from './auth/@config/refresh_token-jwt.config';
import { RolesGuard } from './auth/@guard/roles.guard';
import { PostsModule } from './posts/posts.module';
import { FileModule } from './file/file.module';
import { SocketModule } from './socket/chat.module';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { GroupModule } from './group/group.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    JwtModule.registerAsync(access_tokenJwtConfig.asProvider()),
    ConfigModule.forFeature(access_tokenJwtConfig),
    ConfigModule.forFeature(refresh_tokenJwtConfig),
    PostsModule,
    FileModule,
    SocketModule,
    LikeModule,
    CommentModule,
    BookmarkModule,
    GroupModule,
  ],
  controllers: [UsersController],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
