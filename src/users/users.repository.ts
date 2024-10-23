import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, Prisma } from '@prisma/client';
import { CreateUserDTO } from './dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findUserByUserName(username: string): Promise<User | null> {
    {
      return await this.prisma.user.findUnique({
        where: { username },
      });
    }
  }

  async findAllUsers(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    const { username, email, displayName, avatarUrl, bio } = data;

    return await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash: uuidv4(),
        displayName,
        avatarUrl,
        bio,
      },
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
