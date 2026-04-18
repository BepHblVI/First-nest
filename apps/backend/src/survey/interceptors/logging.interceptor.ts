import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // NestJS標準のロガーを使用
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // GraphQLの実行コンテキストを取得
    const ctx = GqlExecutionContext.create(context);

    // 実行されるリゾルバーのメソッド名（getSurveyなど）を取得
    const info = ctx.getInfo();
    const resolverName = info ? info.fieldName : context.getHandler().name;

    const now = Date.now(); // 処理開始前の時間

    // next.handle() が実際のリゾルバーの処理を呼び出します
    return next.handle().pipe(
      // リゾルバーの処理が正常に終わった「直後」に実行される
      tap(() =>
        this.logger.log(`[${resolverName}] 実行時間: ${Date.now() - now}ms`),
      ),
    );
  }
}
