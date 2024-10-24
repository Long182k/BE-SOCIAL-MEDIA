import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { Roles } from 'src/auth/@decorator/roles.decorator';
import { AuthService } from 'src/auth/auth.service';
import { ROLE } from 'src/auth/util/@enum/role.enum';
import { GetUserByKeywordDTO } from './dto/get-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
