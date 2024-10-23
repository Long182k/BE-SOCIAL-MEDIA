import { Injectable } from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import {
  UpdateHashedRefreshTokenDTO,
  UpdateUserDto,
} from './dto/update-user.dto';
import { UserRepository } from './users.repository';
import { Prisma } from '@prisma/client';
import { GetUserByKeywordDTO } from './dto/get-user.dto';

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

  findAll() {
    return `This action returns all users`;
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
