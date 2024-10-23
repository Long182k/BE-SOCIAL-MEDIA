import { Injectable } from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private userRepository: UserRepository) {}

  async createUser(createUserDto: CreateUserDTO) {
    return await this.userRepository.createUser(createUserDto);
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(username: string) {
    return await this.userRepository.findUserByUserName(username);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
