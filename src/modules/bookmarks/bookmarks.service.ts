import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookmarkEntity } from './bookmark.entity';
import { PostsService } from '../posts/posts.service';
import { PostEntity } from '../posts/post.entity';
import { BookmarkListResult } from './bookmark-list-result';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(BookmarkEntity)
    private readonly bookmarkRepo: Repository<BookmarkEntity>,
    private readonly postsService: PostsService,
  ) {}

  /**
   * Toggle a bookmark on/off. Returns `true` if bookmarked, `false` if removed.
   * Throws NotFound if the post does not exist.
   */
  async toggle(userId: string, postId: string): Promise<boolean> {
    await this.postsService.findById(postId); // existence check

    const existing = await this.bookmarkRepo.findOne({
      where: { userId, postId },
    });
    if (existing) {
      await this.bookmarkRepo.remove(existing);
      return false;
    }

    const bookmark = this.bookmarkRepo.create({ userId, postId });
    await this.bookmarkRepo.save(bookmark);
    return true;
  }

  async isBookmarked(userId: string, postId: string): Promise<boolean> {
    const count = await this.bookmarkRepo.count({
      where: { userId, postId },
    });
    return count > 0;
  }

  /**
   * List the current user's bookmarked posts, newest bookmark first.
   * Excludes archived posts (so a bookmarked-then-archived post disappears
   * from this list, even though the bookmark row still exists).
   */
  async list(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<BookmarkListResult> {
    const [bookmarks, total] = await this.bookmarkRepo.findAndCount({
      where: { userId },
      relations: ['post', 'post.author'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const items = bookmarks
      .map((b) => b.post)
      .filter((p): p is PostEntity => !!p && !p.archived);

    return {
      items,
      hasMore: offset + bookmarks.length < total,
    };
  }

  async countByUser(userId: string): Promise<number> {
    return this.bookmarkRepo.count({ where: { userId } });
  }
}
