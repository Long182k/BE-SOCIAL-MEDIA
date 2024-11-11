import { Injectable } from '@nestjs/common';
import { CreateSocketDto } from './dto/create-socket.dto';
import { UpdateSocketDto } from './dto/update-socket.dto';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  @WebSocketServer() server: Server;

  create(message: string) {
    console.log('🚀  message:', message);
    console.log('🚀  message:', typeof message);
    this.server.emit('message', message);
  }

  findAll() {
    return `This action returns all socket`;
  }

  findOne(id: number) {
    return `This action returns a #${id} socket`;
  }

  update(id: number, updateSocketDto: UpdateSocketDto) {
    return `This action updates a #${id} socket`;
  }

  remove(id: number) {
    return `This action removes a #${id} socket`;
  }
}
