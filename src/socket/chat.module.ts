import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import access_tokenJwtConfig from 'src/auth/@config/access_token-jwt.config';
import refresh_tokenJwtConfig from 'src/auth/@config/refresh_token-jwt.config';
import { PrismaService } from 'src/prisma.service';
import { ChatMessageService } from './chat-message.service';
import { ChatRoomService } from './chat-room.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { CloudinaryService } from 'src/file/file.service';

@Module({
  imports: [
    JwtModule.registerAsync(access_tokenJwtConfig.asProvider()),
    ConfigModule.forFeature(access_tokenJwtConfig),
    ConfigModule.forFeature(refresh_tokenJwtConfig),
  ],
  controllers: [ChatController],
  providers: [
    ChatMessageService,
    ChatRoomService,
    PrismaService,
    JwtService,
    ChatController,
    ChatGateway,
    CloudinaryService,
  ],
  exports: [ChatMessageService, ChatRoomService],
})
export class SocketModule {}
