import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../posts/post.entity';
import { UserEntity } from '../users/user.entity';
import { FollowsModule } from '../follows/follows.module';
import { ExploreService } from './explore.service';
import { ExploreResolver } from './explore.resolver';
import {
  ExplorePostsResult,
  HashtagTrend,
  SuggestedUser,
} from './explore-types';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity, UserEntity]),
    FollowsModule,
  ],
  providers: [
    ExploreService,
    ExploreResolver,
    ExplorePostsResult,
    HashtagTrend,
    SuggestedUser,
  ],
  exports: [ExploreService],
})
export class ExploreModule {}
