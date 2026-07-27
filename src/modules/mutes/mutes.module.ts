import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MuteEntity } from './mute.entity';
import { MutesService } from './mutes.service';
import { MutesResolver } from './mutes.resolver';
import { UserEntity } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MuteEntity, UserEntity])],
  providers: [MutesService, MutesResolver],
  exports: [MutesService],
})
export class MutesModule {}
