import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { UpdateProfileInput } from './dto/update-profile.input';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('user not found');
    return user;
  }

  async findByUsername(username: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { username: username.toLowerCase() },
    });
    if (!user) throw new NotFoundException('user not found');
    return user;
  }

  async updateAvatar(userId: string, url: string): Promise<UserEntity> {
    await this.userRepo.update(userId, { avatarUrl: url });
    return this.findById(userId);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserEntity> {
    await this.userRepo.update(userId, input);
    return this.findById(userId);
  }

  async search(query: string, limit = 20): Promise<UserEntity[]> {
    const q = `%${query.toLowerCase()}%`;
    return this.userRepo
      .createQueryBuilder('u')
      .where('LOWER(u.username) LIKE :q OR LOWER(u.fullName) LIKE :q', { q })
      .orderBy('u.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }
}
