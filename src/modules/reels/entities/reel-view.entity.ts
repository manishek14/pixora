import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../../users/user.entity';
import { PostEntity } from '../../posts/post.entity';

/**
 * Tracks idempotent reel views — one row per (reelId, userId).
 * Re-watching the same reel does not insert a duplicate (UNIQUE constraint).
 * The reel's `viewsCount` column is incremented only on first view.
 */
@Entity('reel_views')
@Unique(['reelId', 'userId'])
@ObjectType('ReelView')
export class ReelViewEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @CreateDateColumn()
  @Field()
  viewedAt: Date;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reelId' })
  reel: Relation<PostEntity>;

  @Column({ type: 'uuid' })
  @Index()
  reelId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'userId' })
  @Field(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;
}
