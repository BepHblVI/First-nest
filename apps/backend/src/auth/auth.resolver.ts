import {
  Args,
  Mutation,
  ObjectType,
  Field,
  Resolver,
  Context,
} from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from './user.model';
import { Response } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { SignUpInput } from './dto/sign-up.input';
import { GqlThrottlerGuard } from './gql-throttler.guard';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@ObjectType()
class LoginResponse {
  @Field()
  access_token!: string;
}

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

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
    @Context() context: { res: Response },
  ) {
    const { access_token, refresh_token } = await this.authService.login(
      username,
      password,
    );

    context.res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return { access_token };
  }

  @Mutation(() => LoginResponse)
  async refresh(@Context() context: { req: any; res: Response }) {
    const refreshToken = context.req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('リフレッシュトークンがありません');
    }

    try {
      return await this.authService.refresh(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('無効なリフレッシュトークンです');
    }
  }
}
