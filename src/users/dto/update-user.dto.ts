import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserDto {}

export class UpdateHashedRefreshTokenDTO {
  @IsString()
  @IsNotEmpty()
  hashedRefreshToken: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
