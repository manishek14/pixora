import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../posts/post.entity';
import { ReelViewEntity } from './entities/reel-view.entity';
import { ReelsService } from './reels.service';
import { ReelsResolver } from './reels.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, ReelViewEntity])],
  providers: [ReelsService, ReelsResolver],
  exports: [ReelsService],
})
export class ReelsModule {}
