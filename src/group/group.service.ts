import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupRole, Role } from '@prisma/client';
import { CloudinaryService } from 'src/file/file.service';

@Injectable()
export class GroupService {
  constructor(
    private prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getGroups(userId: string, onlyUserGroups: boolean) {
    if (onlyUserGroups) {
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
              members: {
                where: {
                  role: {
                    in: [GroupRole.ADMIN, GroupRole.MEMBER],
                  },
                },
              },
            },
          },
        },
      });
    }

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
          select: {
            role: true,
          },
        },
        _count: {
          select: {
            members: {
              where: {
                role: {
                  in: [GroupRole.ADMIN, GroupRole.MEMBER],
                },
              },
            },
          },
        },
      },
    });
  }

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
        userId,
      },
    });
  }

  async getJoinRequests(userId: string, groupId: string) {
    return this.prisma.groupMember.findMany({
      where: {
        groupId,
        role: GroupRole.PENDING,
      },
      include: {
        user: true,
      },
    });
  }

  async approveJoinRequest(adminId: string, groupId: string, userId: string) {
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

  async rejectJoinRequest(
    adminId: string,
    id: string,
    userId: string | undefined,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!group) throw new NotFoundException('Group not found');

    if (userId === 'undefined') {
      console.log('1');
      // User canceling their own request
      const memberExists = await this.prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: adminId,
            groupId: id,
          },
        },
      });

      if (!memberExists) {
        throw new NotFoundException('Member not found in this group');
      }

      return this.prisma.groupMember.delete({
        where: {
          userId_groupId: {
            userId: adminId,
            groupId: id,
          },
        },
      });
    } else {
      console.log('2');
      // Admin rejecting a user's request
      const memberExists = await this.prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId: id,
          },
        },
      });

      if (!memberExists) {
        throw new NotFoundException('Member not found in this group');
      }

      return this.prisma.groupMember.delete({
        where: {
          userId_groupId: {
            userId,
            groupId: id,
          },
        },
      });
    }
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
      include: {
        user: true,
      },
    });

    // If member doesn't exist in the group, they can't be an admin
    if (!member) {
      return false;
    }

    return member.role === GroupRole.ADMIN || member.user.role === Role.ADMIN;
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
                role: {
                  in: [GroupRole.ADMIN, GroupRole.MEMBER],
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
