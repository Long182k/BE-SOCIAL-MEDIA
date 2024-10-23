import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  displayName: string;

  @IsString()
  @IsOptional()
  avatarUrl: string;

  @IsString()
  @IsOptional()
  bio: string;
}

export class FindUserDTO {
    
}
