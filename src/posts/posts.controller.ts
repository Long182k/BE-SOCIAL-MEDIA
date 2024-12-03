import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from 'src/auth/@decorator/roles.decorator';
import { ROLE } from 'src/auth/util/@enum/role.enum';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Roles(ROLE.ADMIN, ROLE.USER)
  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }

  @Post('posts/:userId')
  createPost(
    @Param('userId') userId: string,
    @Body('content') content: string,
  ) {
    return this.postsService.createPost(userId, content);
  }

  @Get('posts/:userId')
  getPosts(
    @Param('userId') userId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.postsService.getPosts(userId, page, limit);
  }

  @Post('posts/:postId/:userId/like')
  likePost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return this.postsService.likePost(userId, postId);
  }

  @Post('posts/:postId/:userId/comments')
  createComment(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
    @Body('content') content: string,
  ) {
    return this.postsService.createComment(userId, postId, content);
  }
}
