import { Controller, Get, UseGuards } from '@nestjs/common';
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
}
