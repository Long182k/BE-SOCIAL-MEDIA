import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto } from 'src/common/pagination.dto';
import { PrismaService } from 'src/prisma.service';
import { CreateCommentDto } from './dto/post.dto';
import { NotificationType } from '@prisma/client';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class InteractionsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      return { liked: false };
    }

    const result = await this.prisma.like.create({
      data: {
        userId,
        postId,
      },
      include: {
        user: true,
        post: true,
      },
    });

    if (result && post.userId !== userId) {
      await this.notificationService.create({
        content: `${result.user.userName} liked your post`,
        type: NotificationType.LIKE,
        senderId: userId,
        receiverId: post.userId,
      });
    }

    return { liked: true };
  }

  async createComment(
    postId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ) {
    const { content, imageUrl } = createCommentDto;
    console.log('🚀  content createComment:', content);
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    const result = await this.prisma.comment.create({
      data: {
        content,
        userId,
        postId,
      },
      include: {
        user: true,
      },
    });

    if (result && post.userId !== userId) {
      await this.notificationService.create({
        content: `${result.user.userName} commented on your post`,
        type: NotificationType.COMMENT,
        senderId: userId,
        receiverId: post.userId,
      });
    }

    return result;
  }
}
