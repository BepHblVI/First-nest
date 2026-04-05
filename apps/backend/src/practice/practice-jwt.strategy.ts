import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class PracticeJwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // 1. チケットをどこから取り出すか（リクエストの「Authorization」ヘッダーから）
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 2. 有効期限が切れていたらエラーにするか
      ignoreExpiration: false,
      // 3. チケットを焼いた時と同じ「秘密の合言葉」で検証する
      secretOrKey: 'MY_SECRET_KEY_12345', 
    });
  }

  // 💡 検証が成功した後に呼ばれる関数
  // ここで返した値が、NestJSの中で「現在ログイン中のユーザー」として扱えるようになります
  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}