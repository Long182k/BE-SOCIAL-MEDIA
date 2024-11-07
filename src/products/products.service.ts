import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from './@dto/create-product.dto';
import { UpdateProductDto } from './@dto/update-product.dto';
import { Prisma, Product } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly productRepository: ProductRepository) {}

  async create(
    createProductDto: CreateProductDto,
  ): Promise<Product & { user: { userName: string } }> {
    return this.productRepository.createProduct(createProductDto);
  }

  async getProductById(id: string): Promise<Product & { user: { userName: string } }> {
    const product = await this.productRepository.findProductById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async getAllProducts(params: {
    skip?: number;
    take?: number;
    cursor?: { id: string };
    where?: Prisma.ProductWhereInput;
    orderBy?: { createdAt?: 'asc' | 'desc' };
    price?: number;
  }): Promise<(Product & { user: { userName: string } })[]> {
    const { price, ...otherParams } = params;

    const whereClause: Prisma.ProductWhereInput = {
      ...otherParams.where,
      ...(price !== undefined && { price }),
    };

    return this.productRepository.findAllProducts({
      ...otherParams,
      where: whereClause,
    });
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product & { user: { userName: string } }> {
    const product = await this.productRepository.updateProduct(id, updateProductDto);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async delete(id: string): Promise<Product & { user: { userName: string } }> {
    const product = await this.productRepository.deleteProduct(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
