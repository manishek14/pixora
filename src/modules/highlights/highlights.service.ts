import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HighlightEntity } from './entities/highlight.entity';
import { HighlightItemEntity, HighlightMediaType } from './entities/highlight-item.entity';
import { StoryEntity } from '../stories/entities/story.entity';
import { CreateHighlightInput } from './dto/create-highlight.input';
import { UpdateHighlightInput } from './dto/update-highlight.input';

@Injectable()
export class HighlightsService {
  private readonly logger = new Logger(HighlightsService.name);

  constructor(
    @InjectRepository(HighlightEntity)
    private readonly highlightRepo: Repository<HighlightEntity>,
    @InjectRepository(HighlightItemEntity)
    private readonly itemRepo: Repository<HighlightItemEntity>,
    @InjectRepository(StoryEntity)
    private readonly storyRepo: Repository<StoryEntity>,
  ) {}

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  async create(userId: string, input: CreateHighlightInput): Promise<HighlightEntity> {
    if (input.items.length === 0) {
      throw new BadRequestException('highlight must contain at least one item');
    }

    const highlight = this.highlightRepo.create({
      userId,
      title: input.title,
      coverUrl: input.coverUrl,
    });
    const saved = await this.highlightRepo.save(highlight);

    const items = input.items.map((it, idx) =>
      this.itemRepo.create({
        highlightId: saved.id,
        mediaUrl: it.mediaUrl,
        mediaType: it.mediaType,
        caption: it.caption,
        order: it.order ?? idx,
      }),
    );
    await this.itemRepo.save(items);

    return this.findOneOwned(userId, saved.id);
  }

  async update(
    userId: string,
    highlightId: string,
    input: UpdateHighlightInput,
  ): Promise<HighlightEntity> {
    const highlight = await this.findOneOwned(userId, highlightId);

    if (input.title !== undefined) highlight.title = input.title;
    if (input.coverUrl !== undefined) highlight.coverUrl = input.coverUrl;
    await this.highlightRepo.save(highlight);

    if (input.items !== undefined) {
      if (input.items.length === 0) {
        throw new BadRequestException('highlight must contain at least one item');
      }
      // Replace items: delete old, insert new
      await this.itemRepo.delete({ highlightId });
      const items = input.items.map((it, idx) =>
        this.itemRepo.create({
          highlightId,
          mediaUrl: it.mediaUrl,
          mediaType: it.mediaType,
          caption: it.caption,
          order: it.order ?? idx,
        }),
      );
      await this.itemRepo.save(items);
    }

    return this.findOneOwned(userId, highlightId);
  }

  async delete(userId: string, highlightId: string): Promise<boolean> {
    const highlight = await this.findOneOwned(userId, highlightId);
    await this.highlightRepo.remove(highlight);
    return true;
  }

  /**
   * Build a highlight directly from a list of the user's own stories.
   * Useful for the "save story to highlight" flow — media (url + type +
   * caption) is COPIED into HighlightItem rows so the highlight survives
   * the source story's 24h expiration.
   */
  async createFromStories(
    userId: string,
    title: string,
    storyIds: string[],
    coverUrl?: string,
  ): Promise<HighlightEntity> {
    if (storyIds.length === 0) {
      throw new BadRequestException('must provide at least one story id');
    }

    const stories = await this.storyRepo.find({
      where: storyIds.map((id) => ({ id, authorId: userId })),
    });

    if (stories.length !== storyIds.length) {
      // Either the story doesn't exist, or it belongs to someone else.
      // Either way, refuse to leak — just say "story not found".
      throw new NotFoundException('one or more stories not found');
    }

    // Order by storyIds order
    const ordered = storyIds
      .map((id) => stories.find((s) => s.id === id))
      .filter((s): s is StoryEntity => !!s);

    const input: CreateHighlightInput = {
      title,
      coverUrl,
      items: ordered.map((s, idx) => ({
        mediaUrl: s.mediaUrl,
        // Map StoryMediaType → HighlightMediaType (same string values, different enum types)
        mediaType:
          s.mediaType === 'video'
            ? HighlightMediaType.Video
            : HighlightMediaType.Image,
        caption: s.caption ?? undefined,
        order: idx,
      })),
    };

    return this.create(userId, input);
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * All highlights belonging to one user. Public — anyone can browse a
   * user's highlights (their stories are already public-by-default).
   */
  async getByUser(userId: string): Promise<HighlightEntity[]> {
    const highlights = await this.highlightRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
    // Load items in one batch, grouped by highlightId, then attach in order
    if (highlights.length === 0) return [];
    const ids = highlights.map((h) => h.id);
    const allItems = await this.itemRepo.find({
      where: { highlightId: In(ids) },
      order: { order: 'ASC' },
    });
    const itemsByHl = new Map<string, HighlightItemEntity[]>();
    for (const it of allItems) {
      const list = itemsByHl.get(it.highlightId) ?? [];
      list.push(it);
      itemsByHl.set(it.highlightId, list);
    }
    for (const h of highlights) {
      h.items = itemsByHl.get(h.id) ?? [];
    }
    return highlights;
  }

  async getById(highlightId: string): Promise<HighlightEntity> {
    const highlight = await this.highlightRepo.findOne({
      where: { id: highlightId },
    });
    if (!highlight) throw new NotFoundException('highlight not found');
    // Load items in correct order (eager load doesn't guarantee order)
    highlight.items = await this.itemRepo.find({
      where: { highlightId },
      order: { order: 'ASC' },
    });
    return highlight;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async findOneOwned(
    userId: string,
    highlightId: string,
  ): Promise<HighlightEntity> {
    const highlight = await this.highlightRepo.findOne({
      where: { id: highlightId },
    });
    if (!highlight) throw new NotFoundException('highlight not found');
    if (highlight.userId !== userId) {
      throw new ForbiddenException('cannot modify another user\u2019s highlight');
    }
    // Fetch items explicitly so we can sort by `order` (eager load doesn't
    // guarantee order across all DB drivers)
    const items = await this.itemRepo.find({
      where: { highlightId },
      order: { order: 'ASC' },
    });
    highlight.items = items;
    return highlight;
  }
}
