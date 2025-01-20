import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatRoomService } from './chat-room.service';
import { ChatMessageService } from './chat-message.service';
import { CreateDirectChatDTO, SendMessageDTO } from './dto/chat.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFiles } from '@nestjs/common';

@Controller('chat')
export class ChatController {
  constructor(
    private chatRoomService: ChatRoomService,
    private chatMessageService: ChatMessageService,
  ) {}

  @Get('room/:userId')
  async getChatRoom(@Param('userId') userId: string) {
    return this.chatRoomService.getChatRoom(userId);
  }

  @Post('room')
  async createDirectChat(@Body() params: CreateDirectChatDTO) {
    return this.chatRoomService.createDirectChat(params);
  }

  @Get('message/:chatRoomId')
  async getMessages(@Param('chatRoomId') chatRoomId: string) {
    return this.chatMessageService.getMessages(chatRoomId);
  }

  @Post('message/send')
  @UseInterceptors(FilesInterceptor('files', 5))
  async sendMessage(
    @Body() params: SendMessageDTO,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.chatMessageService.createMessage(params, files);
  }
}
