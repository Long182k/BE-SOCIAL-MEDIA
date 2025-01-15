import { Module } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { BookmarkController } from './bookmark.controller';
import { PrismaService } from 'src/prisma.service';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  controllers: [BookmarkController],
  providers: [BookmarkService, PrismaService, NotificationService],
})
export class BookmarkModule {}
