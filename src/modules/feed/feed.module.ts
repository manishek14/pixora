import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../posts/post.entity';
import { FeedService } from './feed.service';
import { FeedResolver } from './feed.resolver';
import { FollowsModule } from '../follows/follows.module';
import { AuthModule } from '../auth/auth.module';
import { MutesModule } from '../mutes/mutes.module';
import { BlocksModule } from '../blocks/blocks.module';
import { FeedResult } from './feed-result';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity]),
    FollowsModule,
    AuthModule,
    MutesModule,
    BlocksModule,
  ],
  providers: [FeedService, FeedResolver, FeedResult],
  exports: [FeedService],
})
export class FeedModule {}
