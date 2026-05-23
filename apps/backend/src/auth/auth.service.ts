import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './models/user.model';
import { RefreshToken } from './models/refresh-token.model';
import { ConfigService } from '@nestjs/config';
import { SignUpInput } from './dto/sign-up.input';
import { hashToken } from './helpers/hash-token';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { RESERVED_SLUGS } from '../tenant/constants/reserved-slug';
import { Tenant } from '../tenant/models/tenant.model';
import { Membership } from '../tenant/models/membership.model';
import { Role } from '../tenant/constants/enums';

const DUMMY_PASS = bcrypt.hashSync('Dummy-password', 10);
const REFRESH_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private dataSource: DataSource,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signUp(input: SignUpInput): Promise<User> {
    if (RESERVED_SLUGS.includes(input.username)) {
      throw new ConflictException('このユーザー名は使用できません');
    }
    const hashedPass = await bcrypt.hash(input.password, 10);
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(User, {
        where: { username: input.username },
      });
      if (existing)
        throw new ConflictException('このユーザー名は既に使用されています');

      const user = manager.create(User, {
        username: input.username,
        displayName: input.displayName ?? null,
        password: hashedPass,
      });
      const tenant = manager.create(Tenant, {
        name: input.displayName ?? input.username + "'s tenant",
        slug: input.username,
      });
      const savedUser = await manager.save(user);
      await manager.save(tenant);
      const membership = manager.create(Membership, {
        user,
        tenant,
        role: Role.OWNER,
      });
      await manager.save(membership);

      return savedUser;
    });
  }

  async login(
    username: string,
    pass: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.userRepo.findOne({ where: { username } });
    const isMatch = await bcrypt.compare(pass, user?.password ?? DUMMY_PASS);
    if (!user || !isMatch)
      throw new UnauthorizedException('ユーザー名またはパスワードが違います');

    const payload = { sub: user.id, username: user.username };
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('SECRET_KEY'),
      expiresIn: '15m',
      jwtid: randomUUID(),
    });
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_KEY'),
      expiresIn: '1d',
      jwtid: randomUUID(),
    });
    const refresh = this.refreshTokenRepo.create({
      tokenHash: hashToken(refresh_token),
      user: user,
      revoked: false,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    await this.refreshTokenRepo.save(refresh);

    return {
      access_token,
      refresh_token,
    };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    let payload: { sub: number; username: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_KEY'),
      });
    } catch {
      throw new UnauthorizedException(
        '有効なリフレッシュトークンではありません',
      );
    }
    return this.dataSource.transaction(async (manager) => {
      const oldToken = await manager.findOne(RefreshToken, {
        where: { tokenHash: hashToken(refreshToken), revoked: false },
        relations: { user: true },
      });

      if (!oldToken || payload.sub !== oldToken.user.id)
        throw new UnauthorizedException(
          '有効なリフレッシュトークンではありません',
        );
      const newPayload = {
        sub: oldToken.user.id,
        username: oldToken.user.username,
      };
      const newToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('REFRESH_KEY'),
        expiresIn: '1d',
        jwtid: randomUUID(),
      });
      const newRefresh = manager.create(RefreshToken, {
        tokenHash: hashToken(newToken),
        user: oldToken.user,
        revoked: false,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      });
      const savedNew = await manager.save(newRefresh);
      oldToken.revoked = true;
      oldToken.replacedByTokenId = savedNew.id;
      await manager.save(oldToken);
      const access_token = this.jwtService.sign(
        { sub: newPayload.sub, username: newPayload.username },
        {
          secret: this.configService.get<string>('SECRET_KEY'),
          expiresIn: '15m',
          jwtid: randomUUID(),
        },
      );

      return { access_token, refresh_token: newToken };
    });
  }

  async logout(refreshToken: string): Promise<boolean> {
    await this.refreshTokenRepo.update(
      { tokenHash: hashToken(refreshToken) },
      { revoked: true },
    );
    return true;
  }
}
