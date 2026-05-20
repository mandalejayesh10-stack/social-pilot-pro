import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const status = context.switchToHttp().getResponse().statusCode;
          if (process.env.NODE_ENV !== 'production' || ms > 1000) {
            this.logger.log(`${method} ${url} ${status} +${ms}ms`);
          }
        },
        error: () => {
          const ms = Date.now() - start;
          this.logger.warn(`${method} ${url} ERROR +${ms}ms`);
        },
      }),
    );
  }
}
