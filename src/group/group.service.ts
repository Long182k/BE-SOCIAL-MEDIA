import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupRole } from '@prisma/client';
import { CloudinaryService } from 'src/file/file.service';

@Injectable()
export class GroupService {
  constructor(
    private prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Get groups (user's groups or groups user hasn't joined)
  async getGroups(userId: string, onlyUserGroups: boolean) {
    if (onlyUserGroups) {
      // Get groups where user is a member (role is not PENDING)
      return this.prisma.group.findMany({
        where: {
          members: {
            some: {
              userId,
              NOT: {
                role: GroupRole.PENDING,
              },
            },
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              userName: true,
              avatarUrl: true,
            },
          },
          members: {
            select: {
              role: true,
              user: {
                select: {
                  id: true,
                  userName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      });
    }

    // Get groups where user is NOT a member or has PENDING status
    return this.prisma.group.findMany({
      where: {
        OR: [
          {
            members: {
              none: {
                userId,
              },
            },
          },
          {
            members: {
              some: {
                userId,
                role: GroupRole.PENDING,
              },
            },
          },
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            userName: true,
            avatarUrl: true,
          },
        },
        members: {
          // where: {
          //   userId,
          // },
          select: {
            role: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  }

  // Create group
  async createGroup(
    userId: string,
    dto: CreateGroupDto,
    file: Express.Multer.File,
  ) {
    let groupAvatar: string;
    if (file) {
      const uploadedFile = await this.cloudinaryService.uploadFile(file);
      groupAvatar = uploadedFile.url;
    }

    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        creatorId: userId,
        groupAvatar,
        members: {
          create: {
            userId,
            role: GroupRole.ADMIN,
          },
        },
      },
      include: {
        creator: true,
        members: true,
      },
    });

    return group;
  }

  // Request to join group
  async requestJoinGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is already a member
    const existingMember = group.members.find(
      (member) => member.userId === userId,
    );
    if (existingMember) {
      throw new ForbiddenException('User is already a member of this group');
    }

    // Create join request
    return this.prisma.groupMember.create({
      data: {
        groupId,
        role: GroupRole.PENDING,
      },
    });
  }

  // Get join requests (for admins)
  async getJoinRequests(userId: string, groupId: string) {
    const isAdmin = await this.isGroupAdmin(userId, groupId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can view join requests');
    }

    return this.prisma.groupMember.findMany({
      where: {
        groupId,
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  // Approve join request
  async approveJoinRequest(adminId: string, groupId: string, userId: string) {
    const isAdmin = await this.isGroupAdmin(adminId, groupId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can approve join requests');
    }

    return this.prisma.groupMember.update({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      data: {
        role: GroupRole.MEMBER,
        userId,
      },
    });
  }

  // Helper method to check if user is group admin
  private async isGroupAdmin(
    userId: string,
    groupId: string,
  ): Promise<boolean> {
    const member = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    return member?.role === GroupRole.ADMIN;
  }

  async getGroupById(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: {
            id: true,
            userName: true,
            avatarUrl: true,
          },
        },
        members: {
          where: {
            NOT: {
              role: GroupRole.PENDING,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                email: true,
                dateOfBirth: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: {
              where: {
                NOT: {
                  role: GroupRole.PENDING,
                },
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }
}
