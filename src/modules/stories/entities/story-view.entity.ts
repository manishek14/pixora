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
 * Records that a user has viewed a story. Insertion is idempotent via the
 * (storyId, userId) unique constraint — re-viewing a story just no-ops.
 */
@Entity('story_views')
@Unique(['storyId', 'userId'])
@Index(['storyId'])
@Index(['userId'])
@ObjectType('StoryView')
export class StoryViewEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'uuid' })
  storyId: string;

  @ManyToOne(() => StoryEntity, (story) => story.views, {
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

  @CreateDateColumn()
  @Field()
  viewedAt: Date;
}
