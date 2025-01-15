import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from 'src/auth/@guard/local-auth.guard';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';
import { Public } from './@decorator/public';
import { JwtAuthGuard } from './@guard/jwt-auth.guard';
import { RefreshAuthGuard } from './@guard/refresh-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('/register')
  create(@Body() createUserDto: CreateUserDTO) {
    return this.authService.createUser(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('/logout/:userId')
  async logout(@Param('userId') userId: string) {
    return await this.authService.signOut(userId);
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

  @Get('profile/:id')
  getProfileById(@Param('id') id: string) {
    return this.authService.getUserById(id);
  }
}
