import { IsNotEmpty, IsString } from 'class-validator';

export class JoinRequestDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;
} 