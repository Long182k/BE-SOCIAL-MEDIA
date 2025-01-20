import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Public } from 'src/auth/@decorator/public';
import { ChatMessageService } from './chat-message.service';
import { ChatRoomService } from './chat-room.service';

@Public()
@WebSocketGateway({
  transports: ['websocket'],
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('MessageGateway');
  constructor(
    private chatRoomService: ChatRoomService,
    private chatMessageService: ChatMessageService,
  ) {}

  private userSocketMap: Record<string, string> = {};
  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (userId) {
      this.userSocketMap[userId] = client.id;
      this.logger.log(
        client.id,
        `Client connected: ${client.id}, User ID: ${userId}`,
      );
    }

    this.connectedClients.set(client.id, client);

    this.broadcastOnlineUsers();
  }

  /**
   * Handle disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(client.id, `Client disconnected: ${client.id}`);

    const userId = Object.keys(this.userSocketMap).find(
      (key) => this.userSocketMap[key] === client.id,
    );
    if (userId) delete this.userSocketMap[userId];

    this.connectedClients.delete(client.id);

    this.broadcastOnlineUsers();
  }

  private broadcastOnlineUsers() {
    const onlineUserIds = Object.keys(this.userSocketMap);
    this.logger.log(`Online users ${onlineUserIds}`);

    this.connectedClients.forEach((socket) => {
      socket.emit('getOnlineUsers', onlineUserIds);
    });
  }

  getReceiverSocketId(userId: string): string | undefined {
    return this.userSocketMap[userId];
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: any) {
    const { chatRoomId, senderId, content, receiverId, type } = payload;

    const receiverSocketId = this.userSocketMap[receiverId];

    this.server.to(receiverSocketId).emit('newMessage', payload, (ack) => {
      if (ack) {
        console.log('Message delivered successfully:', ack);
      } else {
        console.error('Message delivery failed.');
      }
    });
  }

  @SubscribeMessage('joinChat')
  handleJoinRoom(client: Socket, userId: string) {
    client.data.userId = userId;
    this.userSocketMap[userId] = client.id;
    this.broadcastOnlineUsers();
  }
}
