import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity';
import { FollowEntity } from '../follows/follow.entity';
import { BlocksModule } from '../blocks/blocks.module';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsResolver } from './suggestions.resolver';
import { SuggestionListResult, SuggestionItem } from './suggestion-types';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, FollowEntity]),
    BlocksModule,
  ],
  providers: [SuggestionsService, SuggestionsResolver, SuggestionListResult, SuggestionItem],
  exports: [SuggestionsService],
})
export class SuggestionsModule {}
