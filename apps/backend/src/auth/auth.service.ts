import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.model';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService, 
  ) {}

  // ユーザー登録
  async signUp(username: string, pass: string) {
    const hashedPass = await bcrypt.hash(pass, 10);
    const user = this.userRepo.create({ username, password: hashedPass });
    return this.userRepo.save(user);
  }

  // 2. ログイン
  async login(username: string, pass: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) throw new UnauthorizedException('ユーザーが見つかりません');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('パスワードが違います');

    const payload = { id: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload,{ expiresIn: '15m' }),
      refresh_token: this.jwtService.sign(payload,{ expiresIn: '1d' })
    };
  }
}