import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

interface UserGrowthData {
  day: string;
  dayName: string;
  count: string;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    // First get the most positive user
    const mostPositiveUser = await this.prisma.user.findFirst({
      select: {
        id: true,
        userName: true,
        _count: {
          select: {
            posts: {
              where: {
                sentiment: 'GOOD',
              },
            },
            comments: {
              where: {
                sentiment: 'GOOD',
              },
            },
          },
        },
      },
      orderBy: [
        {
          posts: {
            _count: 'desc',
          },
        },
        {
          comments: {
            _count: 'desc',
          },
        },
      ],
    });

    const [
      totalUsers,
      activeUsers,
      totalPosts,
      totalGroups,
      totalEvents,
      postSentiments,
      commentSentiments,
      mostNegativeUser,
      userGrowthData,
    ] = await Promise.all([
      // Get total users
      this.prisma.user.count(),

      // Get active users (users who logged in within last 24 hours)
      this.prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Get total posts
      this.prisma.post.count(),

      // Get total groups
      this.prisma.group.count(),

      // Get total events
      this.prisma.event.count(),

      // Get post sentiment statistics
      await this.prisma.post.groupBy({
        by: ['sentiment'],
        _count: {
          sentiment: true,
        },
      }),

      // Get comment sentiment statistics
      await this.prisma.comment.groupBy({
        by: ['sentiment'],
        _count: {
          sentiment: true,
        },
      }),

      // Get user with most negative behavior (excluding most positive user)
      this.prisma.user.findFirst({
        where: {
          NOT: {
            id: mostPositiveUser?.id, // Exclude the most positive user
          },
        },
        select: {
          id: true,
          userName: true,
          _count: {
            select: {
              posts: {
                where: {
                  sentiment: 'BAD',
                },
              },
              comments: {
                where: {
                  sentiment: 'BAD',
                },
              },
            },
          },
        },
        orderBy: [
          {
            posts: {
              _count: 'desc',
            },
          },
          {
            comments: {
              _count: 'desc',
            },
          },
        ],
      }),

      // Get user growth data by day
      this.prisma.$queryRaw<UserGrowthData[]>`
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m-%d') as day,
          DATE_FORMAT(createdAt, '%W') as dayName,
          COUNT(*) as count
        FROM users
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE_FORMAT(createdAt, '%Y-%m-%d'), DATE_FORMAT(createdAt, '%W')
        ORDER BY day DESC
        LIMIT 7
      `,
    ]);

    // Calculate sentiment ratios
    const calculateSentimentRatio = (data: any[]) => {
      const total = data.reduce((acc, curr) => acc + curr._count.sentiment, 0);
      return {
        positive:
          ((data.find((d) => d.sentiment === 'GOOD')?._count.sentiment || 0) /
            total) *
          100,
        negative:
          ((data.find((d) => d.sentiment === 'BAD')?._count.sentiment || 0) /
            total) *
          100,
        moderate:
          ((data.find((d) => d.sentiment === 'MODERATE')?._count.sentiment ||
            0) /
            total) *
          100,
        total: total,
      };
    };

    return {
      totalUsers,
      activeUsers,
      totalPosts,
      totalGroups,
      totalEvents,
      postSentimentRatio: calculateSentimentRatio(postSentiments),
      commentSentimentRatio: calculateSentimentRatio(commentSentiments),
      mostPositiveUser: {
        userName: mostPositiveUser?.userName || 'N/A',
        positivePosts: mostPositiveUser?._count.posts || 0,
        positiveComments: mostPositiveUser?._count.comments || 0,
        totalPositive:
          (mostPositiveUser?._count.posts || 0) +
          (mostPositiveUser?._count.comments || 0),
      },
      mostNegativeUser: {
        userName: mostNegativeUser?.userName || 'N/A',
        negativePosts: mostNegativeUser?._count.posts || 0,
        negativeComments: mostNegativeUser?._count.comments || 0,
        totalNegative:
          (mostNegativeUser?._count.posts || 0) +
          (mostNegativeUser?._count.comments || 0),
      },
      userGrowthData: userGrowthData.map((data) => ({
        day: data.day,
        dayName: data.dayName,
        count: Number(data.count),
      })),
    };
  }

  async getUserManagement(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: pageSize,
        select: {
          id: true,
          userName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
          posts: {
            select: {
              sentiment: true,
            },
          },
          comments: {
            select: {
              sentiment: true,
            },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    const enrichedUsers = users.map((user) => {
      // Calculate sentiment ratios
      const postSentiments = user.posts.reduce(
        (acc, post) => {
          acc[post.sentiment] = (acc[post.sentiment] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const commentSentiments = user.comments.reduce(
        (acc, comment) => {
          acc[comment.sentiment] = (acc[comment.sentiment] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const totalPosts = user.posts.length;
      const totalComments = user.comments.length;

      // Remove the raw posts and comments data
      const { posts, comments, ...userData } = user;

      return {
        ...userData,
        postSentimentRatio: {
          GOOD: ((postSentiments.GOOD || 0) / totalPosts) * 100 || 0,
          MODERATE: ((postSentiments.MODERATE || 0) / totalPosts) * 100 || 0,
          BAD: ((postSentiments.BAD || 0) / totalPosts) * 100 || 0,
        },
        commentSentimentRatio: {
          GOOD: ((commentSentiments.GOOD || 0) / totalComments) * 100 || 0,
          MODERATE:
            ((commentSentiments.MODERATE || 0) / totalComments) * 100 || 0,
          BAD: ((commentSentiments.BAD || 0) / totalComments) * 100 || 0,
        },
      };
    });

    return {
      users: enrichedUsers,
      total,
      page,
      pageSize,
    };
  }

  async toggleUserActivity(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: !user.isActive,
      },
      select: {
        id: true,
        userName: true,
        isActive: true,
      },
    });
  }

  async getGroupManagement(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          description: true,
          groupAvatar: true,
          createdAt: true,
          creator: {
            select: {
              userName: true,
            },
          },
          _count: {
            select: {
              members: true,
              posts: true,
            },
          },
        },
      }),
      this.prisma.group.count(),
    ]);

    return {
      groups,
      total,
      page,
      pageSize,
    };
  }

  async deleteGroup(groupId: string) {
    return this.prisma.group.delete({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getEventManagement(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          description: true,
          eventAvatar: true,
          eventDate: true,
          category: true,
          address: true,
          createdAt: true,
          creator: {
            select: {
              userName: true,
            },
          },
          attendees: {
            where: {
              AND: [
                {
                  OR: [{ role: 'ADMIN' }, { role: 'ATTENDEE' }],
                },
                { status: 'ENROLL' },
              ],
            },
          },
          _count: {
            select: {
              attendees: true,
            },
          },
        },
      }),
      this.prisma.event.count(),
    ]);

    const enrichedEvents = events.map((event) => {
      const { attendees, ...rest } = event;
      return {
        ...rest,
        attendeesCount: attendees.length,
      };
    });

    return {
      events: enrichedEvents,
      total,
      page,
      pageSize,
    };
  }

  async deleteEvent(eventId: string) {
    return this.prisma.event.delete({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
      },
    });
  }
}
