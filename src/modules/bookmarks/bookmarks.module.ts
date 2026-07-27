import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookmarkEntity } from './bookmark.entity';
import { BookmarksService } from './bookmarks.service';
import { BookmarksResolver } from './bookmarks.resolver';
import { BookmarkListResult } from './bookmark-list-result';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [TypeOrmModule.forFeature([BookmarkEntity]), PostsModule],
  providers: [BookmarksService, BookmarksResolver, BookmarkListResult],
  exports: [BookmarksService],
})
export class BookmarksModule {}
