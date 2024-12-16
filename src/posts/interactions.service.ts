import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto } from 'src/common/pagination.dto';
import { PrismaService } from 'src/prisma.service';
import { CreateCommentDto } from './dto/post.dto';

@Injectable()
export class InteractionsService {
  constructor(private prisma: PrismaService) {}

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

    await this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

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

    return this.prisma.comment.create({
      data: {
        content,
        userId,
        postId,
      },
      include: {
        user: true,
      },
    });
  }

  
}
