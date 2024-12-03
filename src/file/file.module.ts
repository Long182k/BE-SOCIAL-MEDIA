import { Module } from '@nestjs/common';
import { CloudinaryService } from './file.service';
import { FileUploadController } from './file.controller';

@Module({
  controllers: [FileUploadController],
  providers: [CloudinaryService],
})
export class FileModule {}
