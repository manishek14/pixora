import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HighlightEntity } from './entities/highlight.entity';
import { HighlightItemEntity } from './entities/highlight-item.entity';
import { StoryEntity } from '../stories/entities/story.entity';
import { HighlightsService } from './highlights.service';
import { HighlightsResolver } from './highlights.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HighlightEntity,
      HighlightItemEntity,
      StoryEntity,
    ]),
  ],
  providers: [HighlightsService, HighlightsResolver],
  exports: [HighlightsService],
})
export class HighlightsModule {}
