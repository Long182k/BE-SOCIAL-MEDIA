import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './@dto/create-product.dto';
import { UpdateProductDto } from './@dto/update-product.dto';
import { Product } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async createProduct(@UploadedFile() file: Express.Multer.File, @Body() createProductDto: CreateProductDto) {
    const imagePath = file ? `/uploads/${file.filename}` : null;

    const newProductData = {
      ...createProductDto,
      image: imagePath, 
    };

    return this.productsService.create(newProductData);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return { message: 'Image uploaded successfully', filePath: `/uploads/${file.filename}` };
  }

  @Get()
  async getAllProducts(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('title') title?: string,
    @Query('location') location?: string,
    @Query('price') price?: number,
  ) {
    return this.productsService.getAllProducts({
      skip: Number(skip) || undefined,
      take: Number(take) || undefined,
      where: {
        title: title ? { contains: title } : undefined,
        location: location ? { contains: location } : undefined,
        price: price !== undefined ? Number(price) : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  async getProductById(@Param('id') id: string): Promise<Product> {
    const product = await this.productsService.getProductById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Patch(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string): Promise<Product> {
    return this.productsService.delete(id);
  }
}
