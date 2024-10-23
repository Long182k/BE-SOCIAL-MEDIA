import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from 'src/auth/@guard/local-auth.guard';
import { Public } from './@decorator/public';
import { RefreshAuthGuard } from './@guard/refresh-auth.guard';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './@guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return req.logout();
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refresh(@Request() req) {
    return this.authService.refreshToken(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  async signOut(@Request() req) {
    return await this.authService.signOut(req.user.userId);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
