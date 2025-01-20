import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import access_tokenJwtConfig from './auth/@config/access_token-jwt.config';
import refresh_tokenJwtConfig from './auth/@config/refresh_token-jwt.config';
import { JwtAuthGuard } from './auth/@guard/jwt-auth.guard';
import { RolesGuard } from './auth/@guard/roles.guard';
import { AuthModule } from './auth/auth.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { CommentModule } from './comment/comment.module';
import { EventsModule } from './events/events.module';
import { FileModule } from './file/file.module';
import { GroupModule } from './group/group.module';
import { NotificationModule } from './notification/notification.module';
import { PostsModule } from './posts/posts.module';
import { PrismaService } from './prisma.service';
import { SocketModule } from './socket/chat.module';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';

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
    CommentModule,
    BookmarkModule,
    GroupModule,
    EventsModule,
    NotificationModule,
    AdminModule,
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
