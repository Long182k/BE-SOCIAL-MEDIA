export class CreatePostDto {
  content: string;
  attachments?: { type: 'image' | 'video'; url: string }[];
}

export class UpdatePostDto {
  content?: string;
  attachments?: { type: 'image' | 'video'; url: string }[];
}

export class CreateCommentDto {
  content: string;
}
