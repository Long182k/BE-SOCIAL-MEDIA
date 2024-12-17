import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from 'src/auth/@decorator/public';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'OK' };
  }
}
