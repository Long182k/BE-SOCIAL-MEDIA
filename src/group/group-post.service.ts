import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePostDto, UpdatePostDto } from 'src/posts/dto/post.dto';
import { NlpService } from '../nlp/nlp.service';
import { CloudinaryService } from 'src/file/file.service';

@Injectable()
export class GroupPostService {
  constructor(
    private prisma: PrismaService,
    private nlpService: NlpService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // Create post in group
  async createGroupPost(
    userId: string,
    groupId: string,
    dto: CreatePostDto,
    files: Express.Multer.File[],
  ) {
    // Check if user is member of the group
    const member = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('Only group members can create posts');
    }

    // Evaluate content using NLP service
    await this.nlpService.evaluateContent(dto.content);

    // Upload files if any
    let attachments = undefined;
    if (files?.length > 0) {
      const uploadedFiles =
        await this.cloudinaryService.uploadMultipleFiles(files);
      attachments = {
        create: uploadedFiles.map((file) => ({
          url: file.url,
          type: file.type as 'image' | 'video',
        })),
      };
    }

    return this.prisma.post.create({
      data: {
        content: dto.content,
        user: { connect: { id: userId } },
        group: { connect: { id: groupId } },
        attachments: attachments,
      },
      include: {
        user: true,
        attachments: true,
      },
    });
  }

  // Get group posts
  async getGroupPosts(groupId: string) {
    return this.prisma.post.findMany({
      where: {
        groupId,
      },
      include: {
        user: true,
        attachments: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Update group post
  async updateGroupPost(
    userId: string,
    groupId: string,
    postId: string,
    dto: UpdatePostDto,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const member = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    // Check if user is post owner or group admin
    if (post.userId !== userId && member?.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only post owner or group admin can update this post',
      );
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        content: dto.content,
        attachments: dto.attachments
          ? {
              deleteMany: {},
              create: dto.attachments,
            }
          : undefined,
      },
      include: {
        user: true,
        attachments: true,
      },
    });
  }

  // Delete group post
  async deleteGroupPost(userId: string, groupId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const member = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    // Check if user is post owner or group admin
    if (post.userId !== userId && member?.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only post owner or group admin can delete this post',
      );
    }

    const deletedPost = await this.prisma.post.delete({
      where: { id: postId },
    });

    return { message: 'Post in group deleted successfully', deletedPost };
  }
}
