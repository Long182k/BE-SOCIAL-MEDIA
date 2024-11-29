import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageDTO } from './dto/chat.dto';

@Injectable()
export class ChatMessageService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway, // Inject ChatGateway for socket logic
  ) {}

  async createMessage(data: SendMessageDTO): Promise<any> {
    const { content, senderId, receiverId, chatRoomId } = data;
    // Create the message in the database
    const newMessage = await this.prisma.chatMessage.create({
      data: {
        content,
        type: 'MESSAGE',
        senderId,
        receiverId,
        chatRoomId,
      },
      include: {
        user: true,
      },
    });

    // Use ChatGateway to get the receiver's socket ID
    const receiverSocketId = this.chatGateway.getReceiverSocketId(receiverId);

    // If the receiver is online, emit the message to their socket
    if (receiverSocketId) {
      // Use the `io` instance from ChatGateway to emit the message
      const io = this.chatGateway['connectedClients'].get(receiverSocketId);
      io?.emit('newMessage', newMessage);
    }

    return newMessage;
  }

  async getMessages(chatRoomId: string): Promise<any> {
    return this.prisma.chatMessage.findMany({
      where: { chatRoomId },
      include: { user: true },
    });
  }
}
