import { Injectable, NotFoundException } from '@nestjs/common';
import { GetUserByKeywordDTO } from './dto/get-user.dto';
import {
  UpdateHashedRefreshTokenDTO,
  UpdateUserDto,
} from './dto/update-user.dto';
import { UserRepository } from './users.repository';
import { PrismaService } from 'src/prisma.service';

interface PaginationParams {
  page: number;
  limit: number;
}

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

  async getFollowers(userId: string, { page, limit }: PaginationParams) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: {
          followingId: userId,
        },
        include: {
          follower: {
            select: {
              id: true,
              userName: true,
              avatarUrl: true,
              bio: true,
              lastLoginAt: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({
        where: {
          followingId: userId,
        },
      }),
    ]);

    return {
      followers: followers.map((follow) => follow.follower),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowing(userId: string, { page, limit }: PaginationParams) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: {
          followerId: userId,
        },
        include: {
          following: {
            select: {
              id: true,
              userName: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({
        where: {
          followerId: userId,
        },
      }),
    ]);

    return {
      following: following.map((follow) => follow.following),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSuggestedUsers(userId: string, { page, limit }: PaginationParams) {
    const skip = (page - 1) * limit;

    // Get IDs of users that current user is already following
    const following = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followingId: true,
      },
    });

    const followingIds = following.map((f) => f.followingId);

    // Get users not being followed, excluding the current user
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          AND: [
            {
              id: {
                notIn: [...followingIds, userId], // Exclude followed users and self
              },
            },
            {
              isActive: true, // Only get active users
            },
          ],
        },
        select: {
          id: true,
          userName: true,
          avatarUrl: true,
          bio: true,
          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
        },
        orderBy: {
          followers: {
            _count: 'desc', // Order by follower count
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({
        where: {
          AND: [
            {
              id: {
                notIn: [...followingIds, userId],
              },
            },
            {
              isActive: true,
            },
          ],
        },
      }),
    ]);

    return {
      suggestions: users.map((user) => ({
        ...user,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        _count: undefined,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
