import { Args, Mutation, ObjectType, Field, Resolver } from '@nestjs/graphql';
import { PracticeAuthService } from './practice-auth.service';
import { PracticeUser } from './user.model';

@ObjectType()
class LoginResponse {
  @Field()
  access_token!: string;
}

@Resolver()
export class PracticeAuthResolver {
  constructor(private authService: PracticeAuthService) {}

  @Mutation(() => PracticeUser)
  async signUpPractice(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.authService.signUp(email, password);
  }

  @Mutation(() => LoginResponse)
  async loginPractice(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.authService.login(email, password);
  }
}