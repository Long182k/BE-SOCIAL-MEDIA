import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, Product } from '@prisma/client';
import { CreateProductDto } from './@dto/create-product.dto';
import { UpdateProductDto } from './@dto/update-product.dto';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(data: CreateProductDto): Promise<Product & { user: { userName: string } }> {
    const userExists = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!userExists) {
      throw new NotFoundException(`User with ID ${data.userId} does not exist`);
    }

    return this.prisma.product.create({
      data: {
        ...data,
        image: data.image,
      },
      include: {
        user: {
          select: {
            userName: true,
          },
        },
      },
    });
  }

  async findProductById(id: string): Promise<Product & { user: { userName: string } }> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            userName: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findAllProducts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ProductWhereUniqueInput;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }): Promise<(Product & { user: { userName: string } })[]> {
    return this.prisma.product.findMany({
      ...params,
      include: {
        user: {
          select: {
            userName: true,
          },
        },
      },
    });
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product & { user: { userName: string } }> {
    return this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        image: data.image, 
      },
      include: {
        user: {
          select: {
            userName: true,
          },
        },
      },
    });
  }

  async deleteProduct(id: string): Promise<Product & { user: { userName: string } }> {
    return this.prisma.product.delete({
      where: { id },
      include: {
        user: {
          select: {
            userName: true,
          },
        },
      },
    });
  }
}
