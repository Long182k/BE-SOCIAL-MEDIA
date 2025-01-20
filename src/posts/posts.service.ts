import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { PaginationDto } from 'src/common/pagination.dto';
import { CloudinaryService } from 'src/file/file.service';
import { AttachmentsUploadedType } from 'src/file/file.type';
import { NlpService } from '../nlp/nlp.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private nlpService: NlpService,
  ) {}

  async create(
    userId: string,
    createPostDto: CreatePostDto,
    files: Express.Multer.File[],
  ) {
    const { content, attachments } = createPostDto;
    let attachmentsUploaded: AttachmentsUploadedType[];

    const sentiment = await this.nlpService.evaluateContent(content);

    if (files && files.length > 0) {
      const uploadedFiles =
        await this.cloudinaryService.uploadMultipleFiles(files);

      attachmentsUploaded = uploadedFiles.map((file) => ({
        type: file.type as 'image' | 'video',
        url: file.url,
      }));
    }

    return this.prisma.post.create({
      data: {
        content,
        userId,
        sentiment,
        attachments: {
          create: attachmentsUploaded ? attachmentsUploaded : attachments,
        },
      },
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
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit, search } = paginationDto;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: limit,
        where: {
          content: {
            contains: search,
          },
          groupId: null,
        },
        include: {
          user: true,
          comments: {
            include: {
              user: true,
              attachments: true,
            },
          },
          attachments: true,
          _count: {
            select: {
              likes: true,
              comments: true,
              bookmarks: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.post.count({
        where: {
          content: {
            contains: search,
          },
          groupId: null,
        },
      }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: true,
        attachments: true,
        comments: {
          include: {
            user: true,
            attachments: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(id: string, userId: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.post.update({
      where: { id },
      data: {
        content: updatePostDto.content,
        attachments: {
          deleteMany: {},
          create: updatePostDto.attachments,
        },
      },
      include: {
        user: true,
        attachments: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.post.delete({
      where: { id },
    });

    return { message: 'Post deleted successfully' };
  }
}
