import { Controller, Get } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Public } from './auth/decorators/auth-access.decorator';
import { AppService } from './app.service';
import {
  ResponseEnvelopeDto,
  type ResponseEnvelope,
} from './common/response/response.schema';
import { buildResponse } from './common/response/response.util';

@ApiTags('health')
@ApiExtraModels(ResponseEnvelopeDto)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({
    description: 'Returns a greeting string',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseEnvelopeDto) },
        {
          properties: {
            data: { type: 'string' },
          },
        },
      ],
    },
  })
  @Get()
  getHello(): ResponseEnvelope<string> {
    const data = this.appService.getHello();
    return buildResponse(data);
  }
}
