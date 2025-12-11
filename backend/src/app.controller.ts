import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/auth-access.decorator';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ description: 'Returns a greeting string' })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
