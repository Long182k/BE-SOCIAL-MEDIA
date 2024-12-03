import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatRoomService } from './chat-room.service';
import { Public } from 'src/auth/@decorator/public';
import { Logger } from '@nestjs/common';
import { ChatRoomType } from './dto/chat.dto';

@Public()
@WebSocketGateway({
  transports: ['websocket'], // Use WebSocket transport
  cors: {
    origin: '*', // Update this to restrict origins if necessary
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('MessageGateway');
  constructor(private readonly chatRoomService: ChatRoomService) {}

  // Map for managing user socket connections
  private userSocketMap: Record<string, string> = {}; // {userId: socketId}
  private connectedClients = new Map<string, Socket>(); // {socketId: Socket instance}

  /**
   * Handle a new connection
   */
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string; // Extract userId from query params

    if (userId) {
      // Map the userId to the connected socket ID
      this.userSocketMap[userId] = client.id;
      this.logger.log(
        client.id,
        `Client connected: ${client.id}, User ID: ${userId}`,
      );
    }

    // Store the client socket instance
    this.connectedClients.set(client.id, client);

    // Emit online users to all connected clients
    this.broadcastOnlineUsers();
  }

  /**
   * Handle disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(client.id, `Client disconnected: ${client.id}`);

    // Remove userId from userSocketMap
    const userId = Object.keys(this.userSocketMap).find(
      (key) => this.userSocketMap[key] === client.id,
    );
    if (userId) delete this.userSocketMap[userId];

    // Remove the client from the connectedClients map
    this.connectedClients.delete(client.id);

    // Emit updated online users
    this.broadcastOnlineUsers();
  }

  /**
   * Broadcast the list of online users to all connected clients
   */
  private broadcastOnlineUsers() {
    const onlineUserIds = Object.keys(this.userSocketMap);
    this.logger.log(`Online users ${onlineUserIds}`);

    // console.log('Online users:', onlineUserIds);
    this.connectedClients.forEach((socket) => {
      socket.emit('getOnlineUsers', onlineUserIds);
    });
  }

  /**
   * Get the socket ID of a receiver by user ID
   */
  getReceiverSocketId(userId: string): string | undefined {
    return this.userSocketMap[userId];
  }

  /**
   * Handle sending a message
   */
  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: any) {
    console.log('🚀  payload:SubscribeMessage ', payload);

    const { chatRoomId, senderId, content, receiverId, type } = payload;

    // Get the chat room and notify all participants except the sender
    const chatRoom = await this.chatRoomService.getChatRoom(senderId);

    const receiverSocketId = this.userSocketMap[receiverId];
    console.log('🚀  receiverSocketId:', receiverSocketId);

    // emit.to(receiverSocketId).emit('newMessage', {
    //   chatRoomId,
    //   senderId,
    //   content,
    //   receiverId,
    // });

    const message = await this.chatRoomService.createDirectChat(payload);
    console.log('🚀  message:', message);

    this.server.to(receiverSocketId).emit('newMessage', payload, (ack) => {
      if (ack) {
        console.log('Message delivered successfully:', ack);
      } else {
        console.error('Message delivery failed.');
      }
    });

    // chatRoom.participants.forEach((participant) => {
    //   if (participant.userId !== senderId) {
    //     const receiverSocketId = this.getReceiverSocketId(participant.userId);
    //     if (receiverSocketId) {
    //       const receiverSocket = this.connectedClients.get(receiverSocketId);
    //       receiverSocket?.emit('receiveMessage', payload);
    //     }
    //   }
    // });
  }

  /**
   * Handle joining a chat room
   */
  @SubscribeMessage('joinChat')
  handleJoinRoom(client: Socket, userId: string) {
    client.data.userId = userId; // Assign userId to client data
    this.userSocketMap[userId] = client.id; // Map userId to socket ID
    this.broadcastOnlineUsers(); // Emit updated online users
  }
}
