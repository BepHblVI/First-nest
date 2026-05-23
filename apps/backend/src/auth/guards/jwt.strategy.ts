import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../models/user.model';

type JwtPayload = {
  sub: User['id'];
  username: User['username'];
};

type JwtUser = Pick<User, 'id' | 'username'>;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SECRET_KEY')!,
    });
  }

  validate(payload: JwtPayload): JwtUser {
    return { id: payload.sub, username: payload.username };
  }
}
