import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';
import { SearchService } from './search.service';
import { SearchResolver } from './search.resolver';
import { HashtagSearchResult, SearchResponse } from './search-types';
import { BlocksModule } from '../blocks/blocks.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, PostEntity]), BlocksModule],
  providers: [SearchService, SearchResolver, HashtagSearchResult, SearchResponse],
  exports: [SearchService],
})
export class SearchModule {}
