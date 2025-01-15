import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        content: createNotificationDto.content,
        type: createNotificationDto.type,
        senderId: createNotificationDto.senderId,
        receiverId: createNotificationDto.receiverId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        receiverId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            userName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findOne(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            userName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.receiverId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return notification;
  }

  async update(
    userId: string,
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ) {
    await this.findOne(userId, id);

    return this.prisma.notification.update({
      where: { id },
      data: {
        content: updateNotificationDto.content,
        type: updateNotificationDto.type,
        senderId: updateNotificationDto.senderId,
        receiverId: updateNotificationDto.receiverId,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.notification.delete({
      where: { id },
    });

    return { message: 'Notification deleted successfully' };
  }

  async updateIsRead(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
