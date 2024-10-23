import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    console.log('Connect to MYSQL successfully');
    await this.$connect();
  }
  async onModuleDestroy() {
    console.log('Disconnect to MYSQL successfully');
    await this.$disconnect();
  }
}
