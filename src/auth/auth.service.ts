import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import refreshTokenJwtConfig from './@config/refresh_token-jwt.config'; // Adjust the path as needed
import { ConfigType } from '@nestjs/config';
import * as argon from 'argon2';
import { UpdateHashedRefreshTokenDTO } from 'src/users/dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(refreshTokenJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshTokenJwtConfig>,
  ) {}

  async validateUser(userName: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(userName);
    const isVerifiedPassword = await argon.verify(
      user.hashedPassword,
      password,
    );

    if (user && isVerifiedPassword) {
      const { hashedPassword, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any) {
    const { accessToken, refreshToken } = await this.generateTokens(user);
    const hashedRefreshToke = await argon.hash(refreshToken);
    const payloadUpdate: UpdateHashedRefreshTokenDTO = {
      userId: user.id,
      hashedRefreshToken: hashedRefreshToke,
    };

    await this.usersService.updateHashedRefreshToken(payloadUpdate);

    // TODO: Store hashedRefreshToken into Redis

    return {
      accessToken,
      refreshToken,
      userId: user.id,
      userName: user.userName,
      avatarUrl: user.avatarUrl,
    };
  }

  async generateTokens(user: any) {
    const payload = {
      userId: user.id,
      userName: user.userName,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshTokenConfig),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(user: any) {
    const { accessToken, refreshToken } = await this.generateTokens(user);

    const hashedRefreshToke = await argon.hash(refreshToken);
    const payloadUpdate: UpdateHashedRefreshTokenDTO = {
      userId: user.id,
      hashedRefreshToken: hashedRefreshToke,
    };

    return {
      id: user.id,
      accessToken,
      refreshToken,
    };
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findUserByKeyword({ id: userId });

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Invalid Refresh Token');
    }

    const isRefreshTokenMatched = await argon.verify(
      user.hashedRefreshToken,
      refreshToken,
    );

    if (!isRefreshTokenMatched) {
      throw new UnauthorizedException('Invalid Refresh Token');
    }

    return { id: userId };
  }

  async validateJWTUser(userId: string) {
    const user = await this.usersService.findUserByKeyword({ id: userId });

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('User Not Found');
    }

    return { userId: user.id, userName: user.userName, role: user.role };
  }

  async signOut(userId: string) {
    const payloadUpdate: UpdateHashedRefreshTokenDTO = {
      userId,
      hashedRefreshToken: null,
    };

    return await this.usersService.updateHashedRefreshToken(payloadUpdate);
  }
}
