// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

interface ChatMessage {
  content: string;
  userId: string;
  chatId: string;
  attachments?: {
    type: 'IMAGE' | 'VIDEO';
    url: string;
  }[];
}

interface ChatRoom {
  name?: string;
  participants: string[];
  creatorId: string;
  type: 'DIRECT' | 'GROUP';
}

@Injectable()
export class SocketService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(payload: ChatMessage) {
    const { content, userId, chatId, attachments } = payload;

    try {
      // Verify if user is part of the chat
      const chatParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          userId,
          chatRoomId: chatId,
        },
      });

      if (!chatParticipant) {
        throw new BadRequestException('User is not a participant of this chat');
      }

      // Create the chat message
      const message = await this.prisma.chatMessage.create({
        data: {
          content,
          userId,
          chatRoomId: chatId,
          attachments: attachments
            ? {
                createMany: {
                  data: attachments.map((attachment) => ({
                    type: attachment.type,
                    url: attachment.url,
                  })),
                },
              }
            : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          attachments: true,
        },
      });

      return message;
    } catch (error) {
      throw new BadRequestException('Failed to save message: ' + error.message);
    }
  }

  async createChat(payload: ChatRoom) {
    const { name, participants, creatorId, type } = payload;

    try {
      // Verify all participants exist
      const users = await this.prisma.user.findMany({
        where: {
          id: {
            in: participants,
          },
        },
      });

      if (users.length !== participants.length) {
        throw new BadRequestException('One or more participants do not exist');
      }

      // Create chat room
      const chatRoom = await this.prisma.chatRoom.create({
        data: {
          name,
          type,
          creatorId,
          participants: {
            create: participants.map((participantId) => ({
              userId: participantId,
            })),
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  userName: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      // Create system message for chat creation
      await this.prisma.chatMessage.create({
        data: {
          content: 'Chat created',
          userId: creatorId,
          chatRoomId: chatRoom.id,
          type: 'SYSTEM',
        },
      });

      return chatRoom;
    } catch (error) {
      throw new BadRequestException('Failed to create chat: ' + error.message);
    }
  }

  async exitChat(chatId: string, userId: string) {
    try {
      // Remove participant from chat
      await this.prisma.chatParticipant.delete({
        where: {
          userId_chatRoomId: {
            userId,
            chatRoomId: chatId,
          },
        },
      });

      // Create system message for user exit
      await this.prisma.chatMessage.create({
        data: {
          content: `User left the chat`,
          userId,
          chatRoomId: chatId,
          type: 'SYSTEM',
        },
      });

      return { success: true, message: 'Successfully left the chat' };
    } catch (error) {
      throw new BadRequestException('Failed to exit chat: ' + error.message);
    }
  }

  // Additional chat-specific methods
  async getChatMessages(chatId: string, limit: number = 50, cursor?: string) {
    return await this.prisma.chatMessage.findMany({
      where: {
        chatRoomId: chatId,
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        attachments: true,
      },
    });
  }

  async getUserChats(userId: string) {
    return await this.prisma.chatRoom.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }
}
