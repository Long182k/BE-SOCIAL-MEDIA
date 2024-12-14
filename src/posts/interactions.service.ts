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

  async toggleBookmark(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    const existingBookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingBookmark) {
      await this.prisma.bookmark.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      return { bookmarked: false };
    }

    await this.prisma.bookmark.create({
      data: {
        userId,
        postId,
      },
    });

    return { bookmarked: true };
  }

  async getBookmarks(userId: string, paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: {
          userId,
        },
        skip,
        take: limit,
        include: {
          post: {
            include: {
              user: true,
              attachments: true,
              _count: {
                select: {
                  likes: true,
                  comments: true,
                  bookmarks: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.bookmark.count({
        where: {
          userId,
        },
      }),
    ]);

    return {
      data: bookmarks.map((bookmark) => bookmark.post),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
