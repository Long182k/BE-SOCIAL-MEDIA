import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { GetUserByKeywordDTO } from './dto/get-user.dto';
import { UpdateHashedRefreshTokenDTO } from './dto/update-user.dto';
import * as argon from 'argon2';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findUserByUserName(userName: string): Promise<User | null> {
    {
      return await this.prisma.user.findUnique({
        where: { userName },
      });
    }
  }

  async findUserByKeyword(keyword: GetUserByKeywordDTO): Promise<User | null> {
    const { userName, id, email, displayName, avatarUrl, bio } = keyword;
    {
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { userName },
            { id },
            { email },
            { displayName },
            { avatarUrl },
            { bio },
          ],
        },
        include: {
          posts: true,
          comments: true,
          likes: true,
          followers: true,
          following: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found.');
      }

      return user;
    }
  }

  async findAllUsers() //   params: {
  //   skip?: number;
  //   take?: number;
  //   cursor?: Prisma.UserWhereUniqueInput;
  //   where?: Prisma.UserWhereInput;
  //   orderBy?: Prisma.UserOrderByWithRelationInput;
  // }
  : Promise<User[]> {
    // const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user
      .findMany
      //   {
      //   skip,
      //   take,
      //   cursor,
      //   where,
      //   orderBy,
      // }
      ();
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    const { userName, password, email } = data;
    const hashedPassword = await argon.hash(password);

    const result = await this.prisma.user.create({
      data: {
        userName,
        email,
        hashedPassword,
      },
    });

    delete result.hashedPassword;

    return result;
  }

  async updateHashedRefreshToken(
    params: UpdateHashedRefreshTokenDTO,
  ): Promise<User> {
    const { hashedRefreshToken, userId } = params;
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        hashedRefreshToken,
      },
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
