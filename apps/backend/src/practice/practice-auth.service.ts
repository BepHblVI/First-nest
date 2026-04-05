import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticeUser } from './user.model';

@Injectable()
export class PracticeAuthService {
  constructor(
    @InjectRepository(PracticeUser)
    private userRepository: Repository<PracticeUser>,
    private jwtService: JwtService, // NestJS公式のJWTツール
  ) {}

  // 1. ユーザー登録（ハッシュ化して保存）
  async signUp(email: string, pass: string) {
    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = this.userRepository.create({ email, password: hashedPassword });
    return this.userRepository.save(user);
  }

  // 2. ログイン（照合してJWTを返す）
  async login(email: string, pass: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('ユーザーが見つかりません');

    // パスワードの照合
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('パスワードが違います');

    // OKなら「秘密の合言葉」で署名したチケット（JWT）を焼く
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}