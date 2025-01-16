import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from '../prisma.service';
import { AttendeeRole, AttendeeStatus, EventCategory } from '@prisma/client';
import { CloudinaryService } from 'src/file/file.service';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    userId: string,
    file: Express.Multer.File,
  ) {
    let eventAvatar: string | undefined;
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(file);
      eventAvatar = uploadResult.url;
    }

    const event = await this.prisma.event.create({
      data: {
        ...createEventDto,
        eventDate: new Date(createEventDto.eventDate),
        creatorId: userId,
        eventAvatar,
        attendees: {
          create: {
            userId,
            role: AttendeeRole.ADMIN,
            status: AttendeeStatus.ENROLL,
          },
        },
      },
      include: {
        attendees: true,
      },
    });
    return event;
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: { attendees: true },
          },
          creator: {
            select: {
              id: true,
              userName: true,
              avatarUrl: true,
            },
          },
          attendees: {
            select: {
              userId: true,
              role: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.event.count(),
    ]);

    return {
      events: events.map((event) => ({
        id: event.id,
        name: event.name,
        description: event.description,
        eventAvatar: event.eventAvatar,
        eventDate: event.eventDate,
        category: event.category,
        address: event.address,
        createdAt: event.createdAt,
        creator: event.creator,
        attendees: event.attendees,
        attendeesCount: event._count.attendees,
        activeAttendeesCount: event.attendees.length,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { attendees: true },
        },
        creator: {
          select: {
            id: true,
            userName: true,
            avatarUrl: true,
          },
        },
        attendees: {
          select: {
            userId: true,
            role: true,
            status: true,
            user: {
              select: {
                userName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!event) throw new NotFoundException('Event not found');

    return {
      id: event.id,
      name: event.name,
      description: event.description,
      eventAvatar: event.eventAvatar,
      eventDate: event.eventDate,
      category: event.category,
      address: event.address,
      createdAt: event.createdAt,
      creator: event.creator,
      attendees: event.attendees.map((attendee) => ({
        userId: attendee.userId,
        role: attendee.role,
        status: attendee.status,
        userName: attendee.user.userName,
        avatarUrl: attendee.user.avatarUrl,
      })),
      attendeesCount: event.attendees.filter(
        (attendee) =>
          (attendee.role === 'ADMIN' || attendee.role === 'ATTENDEE') &&
          attendee.status === 'ENROLL',
      ).length,
    };
  }

  async getAttendees(id: string) {
    const attendees = await this.prisma.eventAttendee.findMany({
      where: {
        eventId: id,
        status: AttendeeStatus.ENROLL,
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

    return {
      attendees,
      count: attendees.length,
    };
  }

  async getJoinRequests(id: string) {
    const requests = await this.prisma.eventAttendee.findMany({
      where: {
        eventId: id,
        role: AttendeeRole.PENDING_ATTENDEE,
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

    return {
      requests,
      count: requests.length,
    };
  }

  async update(id: string, updateEventDto: UpdateEventDto, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { attendees: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    const isAdmin = event.attendees.some(
      (a) => a.userId === userId && a.role === AttendeeRole.ADMIN,
    );

    if (!isAdmin)
      throw new ForbiddenException('Only event admins can update the event');

    return this.prisma.event.update({
      where: { id },
      data: {
        ...updateEventDto,
        eventDate: updateEventDto.eventDate
          ? new Date(updateEventDto.eventDate)
          : undefined,
      },
    });
  }

  async joinEvent(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { attendees: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    const existingAttendee = event.attendees.find((a) => a.userId === userId);

    if (existingAttendee) {
      if (existingAttendee.role === AttendeeRole.ADMIN) {
        throw new ForbiddenException('You are an admin of this event');
      }
      if (existingAttendee.role === AttendeeRole.ATTENDEE) {
        throw new ForbiddenException('You are already a member of this event');
      }
    }

    return this.prisma.eventAttendee.create({
      data: {
        eventId: id,
        userId,
        role: AttendeeRole.PENDING_ATTENDEE,
        status: AttendeeStatus.PENDING,
      },
    });
  }

  async approveRequest(id: string, requestUserId: string, adminUserId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { attendees: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    const isAdmin = event.attendees.some(
      (a) => a.userId === adminUserId && a.role === AttendeeRole.ADMIN,
    );

    // if (!isAdmin)
    //   throw new ForbiddenException('Only event admins can approve requests');

    return this.prisma.eventAttendee.update({
      where: {
        userId_eventId: {
          userId: requestUserId,
          eventId: id,
        },
      },
      data: {
        role: AttendeeRole.ATTENDEE,
        status: AttendeeStatus.ENROLL,
      },
    });
  }

  async cancelAttendance(
    id: string,
    cancelledUserId: string | undefined,
    adminId: string,
  ) {
    if (cancelledUserId !== 'undefined') {
      // Admin cancel attendance
      const event = await this.prisma.event.findUnique({
        where: { id },
        include: { attendees: true },
      });

      if (!event) throw new NotFoundException('Event not found');

      return this.prisma.eventAttendee.delete({
        where: {
          userId_eventId: {
            userId: cancelledUserId,
            eventId: id,
          },
        },
      });
    } else {
      // User cancel attendance
      return this.prisma.eventAttendee.delete({
        where: {
          userId_eventId: {
            userId: adminId,
            eventId: id,
          },
        },
      });
    }
  }

  async remove(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { attendees: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    const isAdmin = event.attendees.some(
      (a) => a.userId === userId && a.role === AttendeeRole.ADMIN,
    );

    if (!isAdmin)
      throw new ForbiddenException('Only event admins can delete the event');

    return this.prisma.event.delete({
      where: { id },
    });
  }

  async getTrendingEvents() {
    const trendingEvents = await this.prisma.event.findMany({
      take: 5,
      include: {
        _count: {
          select: { attendees: true },
        },
        attendees: {
          where: {
            OR: [{ role: AttendeeRole.ADMIN }, { role: AttendeeRole.ATTENDEE }],
            status: AttendeeStatus.ENROLL,
          },
        },
        creator: {
          select: {
            id: true,
            userName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        attendees: {
          _count: 'desc',
        },
      },
    });

    return {
      events: trendingEvents.map((event) => ({
        id: event.id,
        name: event.name,
        description: event.description,
        eventAvatar: event.eventAvatar,
        category: event.category,
        eventDate: event.eventDate,
        address: event.address,
        createdAt: event.createdAt,
        creator: event.creator,
        attendeesCount: event._count.attendees,
        activeAttendeesCount: event.attendees.length,
      })),
    };
  }

  async getEventsByCategory(
    category: EventCategory,
    page: number,
    limit: number,
    userId: string,
  ) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where: {
          AND: [
            {
              category,
            },
            {
              NOT: {
                attendees: {
                  some: {
                    userId,
                    OR: [
                      {
                        status: AttendeeStatus.ENROLL,
                      },
                    ],
                  },
                },
              },
            },
            {
              creatorId: {
                not: userId,
              },
            },
          ],
        },
        skip,
        take: limit,
        include: {
          _count: {
            select: { attendees: true },
          },
          creator: {
            select: {
              id: true,
              userName: true,
              avatarUrl: true,
            },
          },
          attendees: {
            where: {
              OR: [
                { role: AttendeeRole.ADMIN },
                { role: AttendeeRole.ATTENDEE },
              ],
              status: AttendeeStatus.ENROLL,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.event.count({
        where: {
          category,
        },
      }),
    ]);

    return {
      events: events.map((event) => ({
        id: event.id,
        name: event.name,
        description: event.description,
        eventAvatar: event.eventAvatar,
        eventDate: event.eventDate,
        category: event.category,
        address: event.address,
        createdAt: event.createdAt,
        creator: event.creator,
        attendeesCount: event._count.attendees,
        activeAttendeesCount: event.attendees.length,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findDiscoveryEvents(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where: {
          AND: [
            {
              NOT: {
                attendees: {
                  some: {
                    userId,
                    OR: [
                      {
                        status: AttendeeStatus.ENROLL,
                        role: AttendeeRole.ATTENDEE,
                      },
                    ],
                  },
                },
              },
            },
            {
              creatorId: {
                not: userId,
              },
            },
          ],
        },
        skip,
        take: limit,
        include: {
          _count: {
            select: { attendees: true },
          },
          creator: {
            select: {
              id: true,
              userName: true,
              avatarUrl: true,
            },
          },
          attendees: {
            select: {
              userId: true,
              role: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.event.count({
        where: {
          AND: [
            {
              NOT: {
                attendees: {
                  some: {
                    userId,
                    OR: [
                      { status: AttendeeStatus.ENROLL },
                      { role: AttendeeRole.PENDING_ATTENDEE },
                    ],
                  },
                },
              },
            },
            {
              creatorId: {
                not: userId,
              },
            },
          ],
        },
      }),
    ]);

    return {
      events: events.map((event) => ({
        id: event.id,
        name: event.name,
        description: event.description,
        eventAvatar: event.eventAvatar,
        eventDate: event.eventDate,
        category: event.category,
        address: event.address,
        createdAt: event.createdAt,
        creator: event.creator,
        attendees: event.attendees,
        attendeesCount: event._count.attendees,
        activeAttendeesCount: event.attendees.filter(
          (attendee) =>
            (attendee.role === AttendeeRole.ADMIN ||
              attendee.role === AttendeeRole.ATTENDEE) &&
            attendee.status === AttendeeStatus.ENROLL,
        ).length,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMyEvents(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where: {
          OR: [
            {
              creatorId: userId,
            },
            {
              attendees: {
                some: {
                  userId,
                  status: AttendeeStatus.ENROLL,
                  // role: AttendeeRole.ATTENDEE || AttendeeRole.ADMIN,
                },
              },
            },
          ],
        },
        skip,
        take: limit,
        include: {
          _count: {
            select: { attendees: true },
          },
          creator: {
            select: {
              id: true,
              userName: true,
              avatarUrl: true,
            },
          },
          attendees: {
            select: {
              userId: true,
              role: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.event.count({
        where: {
          OR: [
            {
              creatorId: userId,
            },
            {
              attendees: {
                some: {
                  userId,
                  status: AttendeeStatus.ENROLL,
                },
              },
            },
          ],
        },
      }),
    ]);

    return {
      events: events.map((event) => ({
        id: event.id,
        name: event.name,
        description: event.description,
        eventAvatar: event.eventAvatar,
        eventDate: event.eventDate,
        category: event.category,
        address: event.address,
        createdAt: event.createdAt,
        creator: event.creator,
        attendees: event.attendees,
        attendeesCount: event.attendees.filter(
          (attendee) =>
            (attendee.role === AttendeeRole.ADMIN ||
              attendee.role === AttendeeRole.ATTENDEE) &&
            attendee.status === AttendeeStatus.ENROLL,
        ).length,
        activeAttendeesCount: event.attendees.filter(
          (attendee) =>
            (attendee.role === AttendeeRole.ADMIN ||
              attendee.role === AttendeeRole.ATTENDEE) &&
            attendee.status === AttendeeStatus.ENROLL,
        ).length,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
