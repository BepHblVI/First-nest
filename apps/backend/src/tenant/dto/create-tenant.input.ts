import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const SLUG_MESSAGE = 'スラッグは英数小文字、ハイフンのみにしてください';

@InputType()
export class CreateTenantInput {
  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(63)
  @Matches(SLUG_REGEX, { message: SLUG_MESSAGE })
  slug!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}
