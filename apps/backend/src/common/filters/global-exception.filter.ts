import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        message = (res as any).message || message;
        details = (res as any).errors;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production') {
        message = 'Internal server error';
      }
    }

    // Log 5xx errors
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}: ${exception instanceof Error ? exception.stack : exception}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(details && { errors: details }),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
