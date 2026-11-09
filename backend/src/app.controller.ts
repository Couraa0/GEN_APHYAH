import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';
import { StatusResponseDto } from './common/dto/status-response.dto.js';

@ApiTags('Core')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Hello World greeting endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Pesan salam berhasil diambil',
    type: String,
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/status')
  @ApiOperation({ summary: 'Health check dan status service backend' })
  @ApiResponse({
    status: 200,
    description: 'Status service backend berhasil diperoleh',
    type: StatusResponseDto,
  })
  getStatus(): StatusResponseDto {
    return this.appService.getStatus();
  }
}
