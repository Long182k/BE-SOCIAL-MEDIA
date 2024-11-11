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
}
