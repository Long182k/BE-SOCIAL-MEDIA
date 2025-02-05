import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateDirectChatDTO } from './dto/chat.dto';

@Injectable()
export class ChatRoomService {
  constructor(private prisma: PrismaService) {}

  async createDirectChat(params: CreateDirectChatDTO): Promise<any> {
    const { senderId, receiverId, name, type } = params;

    if (!['DIRECT', 'GROUP'].includes(type)) {
      throw new Error(`Invalid chat room type: ${type}`);
    }

    const chatRoom = await this.prisma.chatRoom.create({
      data: {
        type,
        name: type === 'DIRECT' ? `${senderId}_${receiverId}` : name,
        creatorId: senderId,
        participants: {
          createMany: {
            data: [{ userId: senderId }, { userId: receiverId }],
          },
        },
      },
      include: {
        participants: true,
      },
    });

    return chatRoom;
  }

  async getChatRoom(userId: string): Promise<any> {
    return this.prisma.chatRoom.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
              },
            },
          },
        },
        messages: true,
        User: true,
      },
    });
  }
}
