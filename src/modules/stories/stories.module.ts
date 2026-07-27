import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoryEntity } from './entities/story.entity';
import { StoryViewEntity } from './entities/story-view.entity';
import { StoryReactionEntity } from './entities/story-reaction.entity';
import { UserEntity } from '../users/user.entity';
import { FollowsModule } from '../follows/follows.module';
import { StoriesService } from './stories.service';
import { StoriesResolver } from './stories.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StoryEntity,
      StoryViewEntity,
      StoryReactionEntity,
      UserEntity,
    ]),
    FollowsModule,
  ],
  providers: [StoriesService, StoriesResolver],
  exports: [StoriesService],
})
export class StoriesModule {}
