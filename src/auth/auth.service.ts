import { Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import refreshTokenJwtConfig from './@config/refresh_token-jwt.config'; // Adjust the path as needed
import { ConfigType } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(refreshTokenJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshTokenJwtConfig>,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.passwordHash === pass) {
      const { passwordHash, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, this.refreshTokenConfig),
      userId: payload.sub,
      username: payload.username,
    };
  }

  refreshToken(user: any) {
    const payload = { username: user.username, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
