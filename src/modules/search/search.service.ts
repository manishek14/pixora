import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';
import { HashtagSearchResult, SearchResponse } from './search-types';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
  ) {}

  /**
   * Search users by username OR fullName — case-insensitive prefix/contains
   * match. Excludes no-one (results are visible to anyone; per-field privacy
   * is enforced at the resolver level for protected fields).
   *
   * Uses LOWER(...) LIKE LOWER(...) which works on both SQLite and Postgres
   * without needing ILIKE.
   */
  async searchUsers(query: string, limit = 20): Promise<UserEntity[]> {
    const q = this.sanitizeQuery(query);
    if (!q) return [];
    const pattern = `%${q}%`;
    return this.userRepo
      .createQueryBuilder('u')
      .where('LOWER(u.username) LIKE LOWER(:p)', { p: pattern })
      .orWhere('LOWER(COALESCE(u.fullName, \'\')) LIKE LOWER(:p)', { p: pattern })
      .orderBy('u.isVerified', 'DESC')
      .addOrderBy('u.createdAt', 'ASC') // established accounts first
      .take(limit)
      .getMany();
  }

  /**
   * Search non-reel posts by caption. Excludes archived posts (they should
   * not surface in search results).
   */
  async searchPosts(query: string, limit = 20): Promise<PostEntity[]> {
    const q = this.sanitizeQuery(query);
    if (!q) return [];
    const pattern = `%${q}%`;
    return this.postRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.author', 'author')
      .where('p.isReel = :isReel', { isReel: false })
      .andWhere('p.archived = :archived', { archived: false })
      .andWhere('LOWER(COALESCE(p.caption, \'\')) LIKE LOWER(:p)', { p: pattern })
      .orderBy('p.likesCount', 'DESC')
      .addOrderBy('p.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Search reel posts (isReel=true) by caption. Excludes archived reels.
   */
  async searchReels(query: string, limit = 20): Promise<PostEntity[]> {
    const q = this.sanitizeQuery(query);
    if (!q) return [];
    const pattern = `%${q}%`;
    return this.postRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.author', 'author')
      .where('p.isReel = :isReel', { isReel: true })
      .andWhere('p.archived = :archived', { archived: false })
      .andWhere('LOWER(COALESCE(p.caption, \'\')) LIKE LOWER(:p)', { p: pattern })
      .orderBy('p.viewsCount', 'DESC')
      .addOrderBy('p.likesCount', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Search hashtags. We parse the simple-array `hashtags` column from
   * recent (last 90 days) posts + reels and count how many items use each
   * tag whose name starts with the query (case-insensitive).
   *
   * Returns the top-N tags sorted by total count desc.
   */
  async searchHashtags(query: string, limit = 20): Promise<HashtagSearchResult[]> {
    const q = this.sanitizeQuery(query);
    if (!q) return [];

    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    // Pull hashtags column from recent posts+reels (excludes archived)
    const rows = await this.postRepo
      .createQueryBuilder('p')
      .select('p.hashtags', 'hashtags')
      .addSelect('p.isReel', 'isReel')
      .where('p.archived = :archived', { archived: false })
      .andWhere('p.createdAt > :since', { since })
      .andWhere('p.hashtags IS NOT NULL')
      .andWhere("p.hashtags != ''")
      .getRawMany<{ hashtags: string; isReel: boolean }>();

    const counts = new Map<string, { posts: number; reels: number }>();
    for (const row of rows) {
      const tags = (row.hashtags || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      for (const tag of tags) {
        if (!tag.startsWith(q)) continue;
        const entry = counts.get(tag) ?? { posts: 0, reels: 0 };
        if (row.isReel) entry.reels += 1;
        else entry.posts += 1;
        counts.set(tag, entry);
      }
    }

    return Array.from(counts.entries())
      .map(([tag, c]) => ({
        tag,
        postsCount: c.posts,
        reelsCount: c.reels,
        total: c.posts + c.reels,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  /**
   * Unified search — runs users, posts, reels, hashtags queries and bundles
   * them into a single SearchResponse. Useful for a "global search box".
   */
  async searchAll(query: string, limit = 10): Promise<SearchResponse> {
    const [users, posts, reels, hashtags] = await Promise.all([
      this.searchUsers(query, limit),
      this.searchPosts(query, limit),
      this.searchReels(query, limit),
      this.searchHashtags(query, limit),
    ]);
    return { users, posts, reels, hashtags };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Strip leading @/#, lowercase, and reject empty / SQL-wildcard-only queries.
   * Returns '' for empty queries so callers can short-circuit.
   */
  private sanitizeQuery(query: string): string {
    if (!query) return '';
    let q = query.trim().toLowerCase();
    if (q.startsWith('@') || q.startsWith('#')) q = q.slice(1);
    if (!q) return '';
    // Strip SQL wildcards so users can't injection-attack the LIKE pattern.
    q = q.replace(/[%_]/g, '');
    return q;
  }
}
