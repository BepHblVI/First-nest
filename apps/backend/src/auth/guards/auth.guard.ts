import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { GqlContext } from '../../types/gql-context';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { User } from '../models/user.model';
import { Role } from '../../tenant/constants/enums';

// JWTから復元されたユーザー情報の型
type JwtUser = Pick<User, 'id' | 'username'> & {
  tenantId: number;
  role: Role;
};

// passport-jwt が handleRequest に渡してくる info の型
type JwtInfo = JsonWebTokenError | TokenExpiredError | null;

function getGqlRequest(context: ExecutionContext): GqlContext['req'] {
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext<GqlContext>().req;
}

@Injectable()
export class SurveyAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): GqlContext['req'] {
    return getGqlRequest(context);
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): GqlContext['req'] {
    return getGqlRequest(context);
  }

  // ★ メソッド名の後ろに <TUser = JwtUser> を追加し、戻り値を TUser に変更
  handleRequest<TUser = JwtUser>(
    err: Error | null,
    user: any, // 親の型に合わせるために一旦 any (または false | JwtUser) にします
    info: JwtInfo,
    context: ExecutionContext,
  ): TUser {
    const req = this.getRequest(context);

    // 1. 認証エラーのチェック
    if (err || !user) throw err ?? new UnauthorizedException();

    // 2. 内部ロジック用に、一旦 JwtUser としてキャストしてマルチテナントチェックを行う
    const jwtUser = user as JwtUser;
    if (jwtUser.tenantId !== req.tenantId) {
      throw new ForbiddenException('テナントが一致しません');
    }

    // 3. 親のシグネチャを満たすために TUser 型として返す
    return user as TUser;
  }
}
