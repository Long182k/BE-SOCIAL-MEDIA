import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import 'dotenv/config';
import access_tokenJwtConfig from '../@config/access_token-jwt.config';
import { ConfigType } from '@nestjs/config';
import refresh_tokenJwtConfig from '../@config/refresh_token-jwt.config';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor(
    @Inject(refresh_tokenJwtConfig.KEY)
    private refreshTokenJwtConfig: ConfigType<typeof access_tokenJwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: refreshTokenJwtConfig.secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
