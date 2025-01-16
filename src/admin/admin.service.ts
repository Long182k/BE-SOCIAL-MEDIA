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
      this.prisma.post.groupBy({
        by: ['sentiment'],
        _count: {
          sentiment: true,
        },
      }),

      // Get comment sentiment statistics
      this.prisma.comment.groupBy({
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
    console.log('userGrowthData', userGrowthData);
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
}
