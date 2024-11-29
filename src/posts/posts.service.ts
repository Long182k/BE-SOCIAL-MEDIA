import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE a new post
  async create(createPostDto: CreatePostDto) {
    const { content, userId } = createPostDto;

    const result = await this.prisma.post.create({
      data: {
        content,
        userId,
        // attachments: attachments
        //   ? {
        //       connect: attachments.map((id) => ({ id })),
        //     }
        //   : undefined,
      },
      include: {
        user: true,
        bookmarks: true,
        comments: true,
        likes: true,
        linkedNotifications: true,
        attachments: true,
      },
    });

    return result;
  }

  // READ all posts
  async findAll() {
    return await this.prisma.post.findMany({
      include: {
        user: true,
        bookmarks: true,
        comments: true,
        likes: true,
        linkedNotifications: true,
        attachments: true,
      },
    });
  }

  // READ a single post by ID
  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: true,
        bookmarks: true,
        comments: true,
        likes: true,
        linkedNotifications: true,
        attachments: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  // UPDATE a post by ID
  async update(id: string, updatePostDto: UpdatePostDto) {
    const { content } = updatePostDto;

    // Check if post exists
    const postExists = await this.prisma.post.findUnique({ where: { id } });
    if (!postExists) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return await this.prisma.post.update({
      where: { id },
      data: {
        content,
        // attachments: attachments
        //   ? {
        //       set: attachments.map((id) => ({ id })),
        //     }
        //   : undefined,
      },
      include: {
        user: true,
        bookmarks: true,
        comments: true,
        likes: true,
        linkedNotifications: true,
        attachments: true,
      },
    });
  }

  // DELETE a post by ID
  async remove(id: string) {
    // Check if post exists
    const postExists = await this.prisma.post.findUnique({ where: { id } });
    if (!postExists) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return await this.prisma.post.delete({
      where: { id },
    });
  }

  async createPost(userId: string, content: string) {
    return this.prisma.post.create({
      data: {
        content,
        userId,
      },
      include: {
        user: true,
        likes: true,
        comments: true,
        attachments: true,
      },
    });
  }

  async getPosts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return this.prisma.post.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: true,
        likes: true,
        comments: true,
        attachments: true,
      },
    });
  }

  async likePost(userId: string, postId: string) {
    return this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });
  }

  async createComment(userId: string, postId: string, content: string) {
    const comment = await this.prisma.comment.create({
      data: {
        content,
        userId,
        postId,
      },
      include: {
        user: true,
      },
    });

    // Create notification for post owner
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (post && post.userId !== userId) {
      await this.prisma.notification.create({
        data: {
          type: 'COMMENT',
          recipientId: post.userId,
          issuerId: userId,
          postId,
        },
      });
    }

    return comment;
  }
}
