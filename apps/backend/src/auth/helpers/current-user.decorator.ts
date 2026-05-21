import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    // GraphQL用のコンテキストに変換
    const ctx = GqlExecutionContext.create(context);
    // requestオブジェクトからuserを抽出して返す
    return ctx.getContext().req.user;
  },
);
