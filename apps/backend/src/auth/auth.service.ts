import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.model';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ユーザー登録
  async signUp(username: string, pass: string) {
    const existing = await this.userRepo.findOne({ where: { username } });
    if (existing) {
      throw new ConflictException('このユーザー名は既に使用されています');
    }
    const hashedPass = await bcrypt.hash(pass, 10);
    const user = this.userRepo.create({ username, password: hashedPass });
    return this.userRepo.save(user);
  }

  // 2. ログイン
  async login(username: string, pass: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user)
      throw new UnauthorizedException('ユーザー名またはパスワードが違います');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch)
      throw new UnauthorizedException('ユーザー名またはパスワードが違います');

    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('REFRESH_KEY'),
        expiresIn: '1d',
      }),
    };
  }

  async refresh(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('REFRESH_KEY'),
    });
    const access_token = this.jwtService.sign(
      { sub: payload.sub, username: payload.username },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      },
    );
    return { access_token };
  }
}
