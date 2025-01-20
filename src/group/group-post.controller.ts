import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { GroupPostService } from './group-post.service';
import { JwtAuthGuard } from '../auth/@guard/jwt-auth.guard';
import { CreatePostDto, UpdatePostDto } from 'src/posts/dto/post.dto';
import { CurrentUser } from 'src/auth/@decorator/current-user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('groups-posts')
@UseGuards(JwtAuthGuard)
export class GroupPostController {
  constructor(private readonly groupPostService: GroupPostService) {}

  @Post(':groupId')
  @UseInterceptors(FilesInterceptor('files', 5))
  createGroupPost(
    @CurrentUser('userId') userId: string,
    @Param('groupId') groupId: string,
    @Body() dto: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.groupPostService.createGroupPost(userId, groupId, dto, files);
  }

  @Get(':groupId')
  getGroupPosts(@Param('groupId') groupId: string) {
    return this.groupPostService.getGroupPosts(groupId);
  }

  @Put('/edit/:postId/:groupId')
  updateGroupPost(
    @CurrentUser('userId') userId: string,
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.groupPostService.updateGroupPost(userId, groupId, postId, dto);
  }

  @Delete('/delete/:postId/:groupId')
  deleteGroupPost(
    @CurrentUser('userId') userId: string,
    @Param('groupId') groupId: string,
    @Param('postId') postId: string,
  ) {
    return this.groupPostService.deleteGroupPost(userId, groupId, postId);
  }
}
