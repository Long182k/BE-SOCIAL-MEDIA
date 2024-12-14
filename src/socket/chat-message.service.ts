import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { SendMessageDTO } from './dto/chat.dto';

@Injectable()
export class ChatMessageService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: SendMessageDTO): Promise<any> {
    const { content, senderId, receiverId, chatRoomId } = data;
    // Create the message in the database
    const newMessage = await this.prisma.chatMessage.create({
      data: {
        content,
        type: 'DIRECT',
        senderId,
        receiverId,
        chatRoomId,
      },
      include: {
        user: true,
      },
    });

    return newMessage;
  }

  async getMessages(chatRoomId: string): Promise<any> {
    return this.prisma.chatMessage.findMany({
      where: { chatRoomId },
      include: { user: true },
    });
  }
}
