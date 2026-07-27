import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  Index,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { StoryEntity } from './story.entity';
import { UserEntity } from '../../users/user.entity';

/**
 * A user's emoji reaction to a story. One reaction per user per story
 * (unique constraint); updating the emoji replaces the previous reaction.
 */
@Entity('story_reactions')
@Unique(['storyId', 'userId'])
@Index(['storyId'])
@ObjectType('StoryReaction')
export class StoryReactionEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'uuid' })
  storyId: string;

  @ManyToOne(() => StoryEntity, (story) => story.reactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'storyId' })
  story: Relation<StoryEntity>;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'userId' })
  @Field(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({ length: 10 })
  @Field()
  emoji: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;
}
