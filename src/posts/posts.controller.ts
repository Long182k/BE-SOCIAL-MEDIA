import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { InteractionsService } from './interactions.service';
import { CurrentUser } from 'src/auth/@decorator/current-user.decorator';
import { PaginationDto } from 'src/common/pagination.dto';
import { CreateCommentDto, CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { JwtAuthGuard } from 'src/auth/@guard/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly interactionsService: InteractionsService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 5))
  create(
    @CurrentUser('userId') userId: string,
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.postsService.create(userId, createPostDto, files);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.postsService.findAll(paginationDto);
  }

  @Get('single/:id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, userId, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.postsService.remove(id, userId);
  }

  @Post(':id/like')
  toggleLike(
    @Param('id') postId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.interactionsService.toggleLike(postId, userId);
  }

  @Post(':id/comment')
  @UseInterceptors(FilesInterceptor('files', 5))
  createComment(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() createCommentDto: CreateCommentDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.interactionsService.createComment(
      id,
      userId,
      createCommentDto,
      files,
    );
  }
}
