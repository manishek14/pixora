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
import { PostEntity } from '../posts/post.entity';

/**
 * A bookmark = "save for later" on a post OR a reel (both are PostEntity rows;
 * reels are just posts with isReel=true). One row per (userId, postId) —
 * toggling a bookmark that already exists removes it (idempotent toggle).
 */
@Entity('bookmarks')
@Unique(['userId', 'postId'])
@ObjectType('Bookmark')
export class BookmarkEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.bookmarks, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'userId' })
  @Field(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Relation<PostEntity>;

  @Column({ type: 'uuid' })
  @Index()
  postId: string;
}
