import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * パスワード強度のポリシー(NISTガイドラインに沿った緩やかな条件):
 *   - 英字を1文字以上含む
 *   - 数字を1文字以上含む
 *   - その他の文字種(記号など)は許可するが必須にしない
 *
 * 「複雑な記号必須」を強要するとUXが落ち、結果として
 * ユーザーが推測しやすいパターン(例: Pa$$w0rd)を使うので避ける。
 */
export const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).+$/;
export const PASSWORD_MESSAGE =
  'パスワードは英字と数字をそれぞれ1文字以上含めてください';

@InputType()
export class SignUpInput {
  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @Field()
  @IsString()
  @MinLength(8)
  // bcrypt は内部的に 72バイトまでしか見ない仕様。
  // 長いパスワードを受け付けても 73文字目以降は無視されるので、
  // ユーザーに誤解を与えないよう DTO 層で 72 で制限する。
  @MaxLength(72)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password!: string;
}
