import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupPostController } from './group-post.controller';
import { GroupPostService } from './group-post.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from 'src/file/file.service';
import { NlpService } from '../nlp/nlp.service';

@Module({
  controllers: [GroupController, GroupPostController],
  providers: [
    GroupService,
    GroupPostService,
    PrismaService,
    JwtService,
    CloudinaryService,
    NlpService,
  ],
})
export class GroupModule {}
