import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import { Field, ID, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import { UserEntity } from '../../users/user.entity';
import { StoryViewEntity } from './story-view.entity';
import { StoryReactionEntity } from './story-reaction.entity';

export enum StoryMediaType {
  Image = 'image',
  Video = 'video',
}

export enum StoryVisibility {
  Public = 'public',
  CloseFriends = 'close_friends',
}

registerEnumType(StoryMediaType, {
  name: 'StoryMediaType',
  description: 'image | video',
});

registerEnumType(StoryVisibility, {
  name: 'StoryVisibility',
  description: 'public | close_friends — close_friends only visible to viewers on author\u2019s close-friends list',
});

/**
 * Stories are short-lived media (image or video) that auto-expire after 24h.
 * Visibility can be:
 *  - `public`: visible to all followers
 *  - `close_friends`: visible only to viewers on the author's close-friends list
 *    (mutual-follow required: author must follow the viewer AND mark them close)
 */
@Entity('stories')
@Index(['authorId', 'expiresAt'])
@ObjectType('Story')
export class StoryEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => UserEntity, (user) => user.stories, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'authorId' })
  @Field(() => UserEntity)
  author: Relation<UserEntity>;

  @Column()
  @Field()
  mediaUrl: string;

  @Column({ type: 'varchar', length: 20 })
  @Field(() => StoryMediaType)
  mediaType: StoryMediaType;

  @Column({ type: 'text', nullable: true })
  @Field({ nullable: true })
  caption?: string;

  @Column({ type: 'varchar', length: 20, default: StoryVisibility.Public })
  @Field(() => StoryVisibility)
  visibility: StoryVisibility;

  @Column()
  @Field()
  expiresAt: Date;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;

  // Relations (lazy — not eager to keep payload small in feed queries)
  @OneToMany(() => StoryViewEntity, (view) => view.story)
  views: Relation<StoryViewEntity>[];

  @OneToMany(() => StoryReactionEntity, (reaction) => reaction.story)
  reactions: Relation<StoryReactionEntity>[];

  // Computed (filled in by service layer, not persisted)
  @Field(() => Int, { nullable: true })
  viewsCount?: number;

  @Field(() => Boolean, { nullable: true })
  isViewedByMe?: boolean;

  @Field(() => Boolean, { nullable: true })
  isExpired?: boolean;
}
