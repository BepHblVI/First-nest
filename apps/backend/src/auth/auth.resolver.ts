import {
  Args,
  Mutation,
  ObjectType,
  Field,
  Resolver,
  Context,
} from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from './models/user.model';
import { UnauthorizedException } from '@nestjs/common';
import { SignUpInput } from './dto/sign-up.input';
import { GqlThrottlerGuard } from './guards/gql-throttler.guard';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { GqlContext } from '../types/gql-context';

@ObjectType()
class LoginResponse {
  @Field()
  access_token!: string;
}

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  private setRefreshCookie(context: GqlContext, refreshToken: string) {
    context.res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(context: GqlContext) {
    context.res.clearCookie('refresh_token');
  }

  @Mutation(() => User)
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } }) // 1分に3回まで
  async signUp(@Args('input') input: SignUpInput) {
    return this.authService.signUp(input);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // 1分に5回まで
  async login(
    @Args('username') username: string,
    @Args('password') password: string,
    @Context() context: GqlContext,
  ) {
    const { access_token, refresh_token } = await this.authService.login(
      username,
      password,
    );

    this.setRefreshCookie(context, refresh_token);
    return { access_token };
  }

  @Mutation(() => LoginResponse)
  async refresh(@Context() context: GqlContext) {
    const refreshToken = context.req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('リフレッシュトークンがありません');
    }

    const { access_token, refresh_token } =
      await this.authService.refresh(refreshToken);
    this.setRefreshCookie(context, refresh_token);
    return { access_token };
  }
  @Mutation(() => Boolean)
  async logout(@Context() context: GqlContext) {
    const refreshToken = context.req.cookies?.refresh_token;
    this.clearRefreshCookie(context);

    if (refreshToken) return await this.authService.logout(refreshToken);
    return true;
  }
}
