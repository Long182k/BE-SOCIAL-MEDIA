import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type ChatRoomType = 'DIRECT' | 'GROUP';

export class CreateDirectChatDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsString()
  type?: ChatRoomType;

  @IsNotEmpty()
  @IsString()
  senderId: string;

  @IsNotEmpty()
  @IsString()
  receiverId: string;
}

export class SendMessageDTO {
  @IsNotEmpty()
  @IsString()
  chatRoomId: string;

  @IsNotEmpty()
  @IsString()
  senderId: string;

  @IsNotEmpty()
  @IsString()
  receiverId: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}
