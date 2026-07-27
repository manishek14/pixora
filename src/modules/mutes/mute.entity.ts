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
 * A mute = "muter" no longer wants to see content from "muted" in their feed
 * or story tray — but unlike block, the muted user is not notified and can
 * still interact with the muter.
 *
 * Two independent flags:
 *   - mutePosts:   hide the muted user's posts/reels from the muter's feed
 *   - muteStories: hide the muted user's stories from the muter's story tray
 *
 * One row per (muterId, mutedId) — re-muting updates flags in place.
 * Self-mute is rejected at the service layer.
 */
@Entity('mutes')
@Unique(['muterId', 'mutedId'])
@Index(['muterId', 'mutedId'])
@ObjectType('Mute')
export class MuteEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  /** The user who initiated the mute. */
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'muterId' })
  @Field(() => UserEntity)
  muter: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  @Index()
  @Field(() => ID)
  muterId: string;

  /** The user who is being muted. */
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'mutedId' })
  @Field(() => UserEntity)
  muted: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  @Index()
  @Field(() => ID)
  mutedId: string;

  @Column({ default: true })
  @Field()
  mutePosts: boolean;

  @Column({ default: true })
  @Field()
  muteStories: boolean;
}
