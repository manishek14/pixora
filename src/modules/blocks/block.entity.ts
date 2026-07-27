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
import { UserEntity } from '../users/user.entity';

/**
 * A block = "blocker" prevents "blocked" from interacting with them.
 *
 * Asymmetric: A blocks B means B can't see A's posts/stories, can't follow A,
 * can't like/comment on A's posts, and can't DM A. The reverse is independent —
 * B can still choose to block A (or not).
 *
 * One row per (blockerId, blockedId) — the same pair can't have two rows.
 * Self-block is rejected at the service layer.
 */
@Entity('blocks')
@Unique(['blockerId', 'blockedId'])
@Index(['blockerId', 'blockedId'])
@ObjectType('Block')
export class BlockEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  /** The user who initiated the block. */
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'blockerId' })
  @Field(() => UserEntity)
  blocker: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  @Index()
  @Field(() => ID)
  blockerId: string;

  /** The user who is being blocked. */
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'blockedId' })
  @Field(() => UserEntity)
  blocked: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  @Index()
  @Field(() => ID)
  blockedId: string;
}
