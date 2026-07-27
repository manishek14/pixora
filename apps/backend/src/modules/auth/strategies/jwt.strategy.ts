import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../users/user.entity';
import { JwtPayload } from '../auth.service';

interface GqlRequestWithUser extends Express.Request {
  headers: { authorization?: string; Authorization?: string };
}

const extractFromGql = (req: any): string | null => {
  const auth = req?.headers?.authorization || req?.headers?.Authorization;
  if (!auth) return null;
  const [type, token] = auth.split(' ');
  return type === 'Bearer' && token ? token : null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: extractFromGql,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') as string,
    });
  }

  async validate(payload: JwtPayload): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('user not found');
    return user;
  }
}
