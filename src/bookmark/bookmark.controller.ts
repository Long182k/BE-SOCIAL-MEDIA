import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from 'src/auth/@decorator/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';
import { BookmarkService } from './bookmark.service';

@Controller('bookmark')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post(':id')
  toggleBookmark(
    @Param('id') postId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.bookmarkService.toggleBookmark(postId, userId);
  }

  @Get('')
  getBookmarks(
    @CurrentUser('userId') userId: string,
  ) {
    return this.bookmarkService.getBookmarks(userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    console.log('id remove',id)
    return this.bookmarkService.remove(id);
  }
}
