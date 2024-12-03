import { Injectable } from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import { GetUserByKeywordDTO } from './dto/get-user.dto';
import {
  UpdateHashedRefreshTokenDTO,
  UpdateUserDto,
} from './dto/update-user.dto';
import { UserRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private userRepository: UserRepository) {}

  async createUser(createUserDto: CreateUserDTO) {
    return await this.userRepository.createUser(createUserDto);
  }

  async updateHashedRefreshToken(
    updateHashedRefreshTokenDTO: UpdateHashedRefreshTokenDTO,
  ) {
    return await this.userRepository.updateHashedRefreshToken(
      updateHashedRefreshTokenDTO,
    );
  }

  async findAll() {
    return await this.userRepository.findAllUsers();
  }

  async findOne(userName: string) {
    return await this.userRepository.findUserByUserName(userName);
  }

  async findUserByKeyword(keyword: GetUserByKeywordDTO) {
    return await this.userRepository.findUserByKeyword(keyword);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
