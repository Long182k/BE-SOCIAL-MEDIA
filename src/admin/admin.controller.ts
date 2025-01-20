import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { Roles } from 'src/auth/@decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/@guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/@guard/roles.guard';
import { ROLE } from 'src/auth/util/@enum/role.enum';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard-stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getUserManagement(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.adminService.getUserManagement(
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
  }

  @Patch('users/:userId/toggle-activity')
  async toggleUserActivity(@Param('userId') userId: string) {
    return this.adminService.toggleUserActivity(userId);
  }

  @Get('groups')
  async getGroupManagement(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.adminService.getGroupManagement(
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
  }

  @Delete('groups/:groupId')
  async deleteGroup(@Param('groupId') groupId: string) {
    return this.adminService.deleteGroup(groupId);
  }

  @Get('events')
  async getEventManagement(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.adminService.getEventManagement(
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
  }

  @Delete('events/:eventId')
  async deleteEvent(@Param('eventId') eventId: string) {
    return this.adminService.deleteEvent(eventId);
  }
}
