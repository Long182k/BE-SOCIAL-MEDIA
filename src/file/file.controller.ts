import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './file.service';

@Controller('upload')
export class FileUploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingleFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.validateFile(file);

    const uploadedUrl = await this.cloudinaryService.uploadFile(file);
    return { url: uploadedUrl };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedUrls = await Promise.all(
      files.map(async (file) => {
        this.validateFile(file);
        return this.cloudinaryService.uploadFile(file);
      }),
    );

    return { urls: uploadedUrls };
  }

  private validateFile(file: Express.Multer.File) {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds the limit (5MB)');
    }

    // File type validation
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/jpg',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, JPG, and GIF are allowed.',
      );
    }
  }
}
