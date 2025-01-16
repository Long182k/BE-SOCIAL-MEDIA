import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventCategory } from '@prisma/client';
import { CurrentUser } from 'src/auth/@decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/@guard/jwt-auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('eventAvatar'))
  async create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let eventAvatar: string | undefined;

    return this.eventsService.create(
      {
        ...createEventDto,
      },
      userId,
      file,
    );
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.eventsService.findAll(+page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Get(':id/attendees')
  getAttendees(@Param('id') id: string) {
    return this.eventsService.getAttendees(id);
  }

  @Get(':id/requests')
  getJoinRequests(@Param('id') id: string) {
    return this.eventsService.getJoinRequests(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.eventsService.update(id, updateEventDto, userId);
  }

  @Post(':id/join')
  joinEvent(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.eventsService.joinEvent(id, userId);
  }

  @Post(':id/approve/:userId')
  approveRequest(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser('userId') adminUserId: string,
  ) {
    return this.eventsService.approveRequest(id, userId, adminUserId);
  }

  @Post(':id/cancel/:cancelledUserId')
  cancelAttendance(
    @Param('id') id: string,
    @Param('cancelledUserId') cancelledUserId: string,
    @CurrentUser('userId') adminId: string,
  ) {
    // userID is executer, cancelledUserId is the user who is cancelled
    return this.eventsService.cancelAttendance(id, cancelledUserId, adminId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.eventsService.remove(id, userId);
  }

  @Get('trending/top')
  getTrendingEvents() {
    return this.eventsService.getTrendingEvents();
  }

  @Get('category/:category')
  getEventsByCategory(
    @Param('category', new ParseEnumPipe(EventCategory))
    category: EventCategory,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser('userId') userId: string,
  ) {
    return this.eventsService.getEventsByCategory(
      category,
      +page,
      +limit,
      userId,
    );
  }

  @Get('/all/discover')
  findDiscoveryEvents(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser('userId') userId: string,
  ) {
    return this.eventsService.findDiscoveryEvents(userId, +page, +limit);
  }

  @Get('/all/my-events')
  findMyEvents(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser('userId') userId: string,
  ) {
    return this.eventsService.findMyEvents(userId, +page, +limit);
  }
}
