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

  async findOne(email: string) {
    return await this.userRepository.findUserByEmail(email);
  }

  async findUserByKeyword(keyword: GetUserByKeywordDTO) {
    return await this.userRepository.findUserByKeyword(keyword);
  }

  async editProfile(updateUserDto: UpdateUserDto, userId: string) {
    return await this.userRepository.update(userId, {
      ...updateUserDto,
      dateOfBirth: new Date(updateUserDto.dateOfBirth),
    });
  }

  async updateAvatar(id: string, avatarUrl: string) {
    return await this.userRepository.update(id, { avatarUrl });
  }

  async updateCoverPage(id: string, coverPageUrl: string) {
    return await this.userRepository.update(id, { coverPageUrl });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
