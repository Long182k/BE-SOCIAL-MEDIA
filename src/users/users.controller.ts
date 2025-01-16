import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/auth/@decorator/current-user.decorator';
import { Roles } from 'src/auth/@decorator/roles.decorator';
import { ROLE } from 'src/auth/util/@enum/role.enum';
import { CloudinaryService } from 'src/file/file.service';
import { GetUserByKeywordDTO } from './dto/get-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  findAll(@CurrentUser('userId') userId: string) {
    return this.usersService.findAll(userId);
  }

  @Get('/userName')
  findOne(@Param('userName') userName: string) {
    return this.usersService.findOne(userName);
  }

  @Roles(ROLE.ADMIN)
  @Get('/keyword')
  async findUserByKeyword(@Body() keyword: GetUserByKeywordDTO) {
    return await this.usersService.findUserByKeyword(keyword);
  }

  @Patch('/edit-profile')
  async editProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.editProfile({ ...updateUserDto }, userId);
  }

  @Patch('change/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async updateAvatar(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const uploadedFile = await this.cloudinaryService.uploadFile(file);
    return await this.usersService.updateAvatar(userId, uploadedFile.url);
  }

  @Patch('change/cover-page')
  @UseInterceptors(FileInterceptor('file'))
  async updateCoverPage(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const uploadedFile = await this.cloudinaryService.uploadFile(file);
    return await this.usersService.updateCoverPage(userId, uploadedFile.url);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
