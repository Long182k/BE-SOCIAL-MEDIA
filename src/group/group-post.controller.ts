import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { GroupPostService } from './group-post.service';
import { JwtAuthGuard } from '../auth/@guard/jwt-auth.guard';
import { CreatePostDto, UpdatePostDto } from 'src/posts/dto/post.dto';
import { CurrentUser } from 'src/auth/@decorator/current-user.decorator';

@Controller('groups/:groupId/posts')
@UseGuards(JwtAuthGuard)
export class GroupPostController {
  constructor(private readonly groupPostService: GroupPostService) {}

  @Post()
  createGroupPost(
    @CurrentUser('userId') userId: string,
    @Param('groupId') groupId: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.groupPostService.createGroupPost(userId, groupId, dto);
  }

  @Get()
  getGroupPosts(@Param('groupId') groupId: string) {
    return this.groupPostService.getGroupPosts(groupId);
  }

  @Put(':postId')
  updateGroupPost(
    @CurrentUser('userId') userId: string,
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.groupPostService.updateGroupPost(userId, groupId, postId, dto);
  }

  @Delete(':postId')
  deleteGroupPost(
    @CurrentUser('userId') userId: string,
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
  ) {
    return this.groupPostService.deleteGroupPost(userId, groupId, postId);
  }
}
