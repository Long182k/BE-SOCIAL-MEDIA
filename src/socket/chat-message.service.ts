import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { SendMessageDTO } from './dto/chat.dto';
import { CloudinaryService } from 'src/file/file.service';

@Injectable()
export class ChatMessageService {
  constructor(
    private prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createMessage(data: SendMessageDTO, files?: Express.Multer.File[]) {
    const { content, senderId, receiverId, chatRoomId } = data;

    let attachmentsUploaded = [];

    if (files && files.length > 0) {
      const uploadedFiles =
        await this.cloudinaryService.uploadMultipleFiles(files);
      attachmentsUploaded = uploadedFiles.map((file) => ({
        type: file.type as 'image' | 'video',
        url: file.url,
      }));
    }

    const newMessage = await this.prisma.chatMessage.create({
      data: {
        content,
        type: 'DIRECT',
        senderId,
        receiverId,
        chatRoomId,
        attachments: {
          createMany: {
            data: attachmentsUploaded,
          },
        },
      },
      include: {
        user: true,
        attachments: true,
      },
    });

    return newMessage;
  }

  async getMessages(chatRoomId: string): Promise<any> {
    return this.prisma.chatMessage.findMany({
      where: { chatRoomId },
      include: {
        user: true,
        attachments: true,
      },
    });
  }
}
