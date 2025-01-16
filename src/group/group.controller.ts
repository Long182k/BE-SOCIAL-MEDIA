import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/auth/@decorator/current-user.decorator';
import { JwtAuthGuard } from '../auth/@guard/jwt-auth.guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupService } from './group.service';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  getGroups(
    @CurrentUser('userId') userId: string,
    @Query('onlyUserGroups') onlyUserGroups?: boolean,
  ) {
    return this.groupService.getGroups(userId, onlyUserGroups);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  createGroup(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateGroupDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.groupService.createGroup(userId, dto, file);
  }

  @Post(':groupId/join')
  requestJoinGroup(
    @CurrentUser('userId') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.requestJoinGroup(userId, groupId);
  }

  @Get(':groupId/join-requests')
  getJoinRequests(
    @CurrentUser('userId') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.getJoinRequests(userId, groupId);
  }

  @Post(':groupId/approve/:userId')
  approveJoinRequest(
    @CurrentUser('userId') adminId: string,
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.groupService.approveJoinRequest(adminId, groupId, userId);
  }

  @Post(':groupId/reject/:userId')
  rejectJoinRequest(
    @CurrentUser('userId') adminId: string,
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.groupService.rejectJoinRequest(adminId, groupId, userId);
  }

  @Get(':groupId')
  getGroupById(
    @CurrentUser('userId') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.getGroupById(userId, groupId);
  }
}
