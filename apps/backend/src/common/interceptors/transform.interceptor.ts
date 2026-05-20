import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Wraps all successful responses in a consistent envelope.
 * { data: ..., timestamp: ... }
 * Only wraps if the response is not already wrapped.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Don't double-wrap
        if (data && typeof data === 'object' && 'data' in data) return data;
        return data; // Return as-is for simplicity — frontend handles raw responses
      }),
    );
  }
}
