import { Injectable, NotFoundException } from '@nestjs/common';
import { GetUserByKeywordDTO } from './dto/get-user.dto';
import {
  UpdateHashedRefreshTokenDTO,
  UpdateUserDto,
} from './dto/update-user.dto';
import { UserRepository } from './users.repository';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    private prisma: PrismaService,
  ) {}

  async updateHashedRefreshToken(
    updateHashedRefreshTokenDTO: UpdateHashedRefreshTokenDTO,
  ) {
    return await this.userRepository.updateHashedRefreshToken(
      updateHashedRefreshTokenDTO,
    );
  }

  async findAll(userId: string) {
    return await this.userRepository.findAllUsers(userId);
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

  async followUser(followerId: string, userId: string) {
    // First check if users exist
    const [follower, user] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: followerId },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
      }),
    ]);

    if (!follower || !user) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: followerId,
            followingId: userId,
          },
        },
      });
    } else {
      // Follow
      await this.prisma.follow.create({
        data: {
          followerId: followerId,
          followingId: userId,
        },
      });
    }

    // Get updated counts
    const [followers, following] = await Promise.all([
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      isFollowing: !existingFollow,
      followersCount: followers,
      followingCount: following,
    };
  }

  async getFollowStatus(followerId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [isFollowing, followers, following] = await Promise.all([
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: followerId,
            followingId: userId,
          },
        },
      }),
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      isFollowing: !!isFollowing,
      followersCount: followers,
      followingCount: following,
    };
  }
}
