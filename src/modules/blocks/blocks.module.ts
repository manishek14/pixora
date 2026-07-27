import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockEntity } from './block.entity';
import { BlocksService } from './blocks.service';
import { BlocksResolver } from './blocks.resolver';
import { UserEntity } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlockEntity, UserEntity])],
  providers: [BlocksService, BlocksResolver],
  exports: [BlocksService],
})
export class BlocksModule {}
