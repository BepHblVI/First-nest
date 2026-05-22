import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

// パスワード
export const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).+$/;
export const PASSWORD_MESSAGE =
  'パスワードは英字と数字をそれぞれ1文字以上含めてください';

// ユーザー名 (slug 互換)
export const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
export const USERNAME_MESSAGE =
  'ユーザー名は英小文字・数字・ハイフンのみ使用可能、ハイフンで開始/終了不可';

@InputType()
export class SignUpInput {
  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(USERNAME_REGEX, { message: USERNAME_MESSAGE })
  username!: string;

  // 表示名 (省略可)
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password!: string;
}
