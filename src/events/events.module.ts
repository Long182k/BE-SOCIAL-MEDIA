import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from 'src/file/file.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService, PrismaService, JwtService, CloudinaryService],
})
export class EventsModule {}
