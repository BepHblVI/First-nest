import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// 'jwt' という名前の戦略（さっき作ったStrategy）を使って守る
export class PracticeAuthGuard extends AuthGuard('jwt') {
  // 💡 GraphQL特有のお作法：リクエスト情報をGraphQL用に変換して門番に渡す
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}