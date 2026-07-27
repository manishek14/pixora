import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  Relation,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { PostEntity } from '../posts/post.entity';
import { LikeEntity } from '../likes/like.entity';
import { CommentEntity } from '../comments/comment.entity';
import { FollowEntity } from '../follows/follow.entity';
import { StoryEntity } from '../stories/entities/story.entity';
import { HighlightEntity } from '../highlights/entities/highlight.entity';
import { BookmarkEntity } from '../bookmarks/bookmark.entity';

@Entity('users')
@ObjectType('User')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ unique: true, length: 50 })
  @Index()
  @Field()
  username: string;

  @Column({ unique: true, length: 255 })
  @Index()
  @Field()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true, select: false })
  refreshToken?: string;

  @Column({ nullable: true, length: 100 })
  @Field({ nullable: true })
  fullName?: string;

  @Column({ type: 'text', nullable: true })
  @Field({ nullable: true })
  bio?: string;

  @Column({ nullable: true, length: 255 })
  @Field({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true, length: 255 })
  @Field({ nullable: true })
  website?: string;

  @Column({ default: false })
  @Field()
  isPrivate: boolean;

  @Column({ default: false })
  @Field()
  isVerified: boolean;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;

  // Relations
  @OneToMany(() => PostEntity, (post) => post.author)
  @Field(() => [PostEntity], { nullable: true })
  posts: Relation<PostEntity>[];

  @OneToMany(() => LikeEntity, (like) => like.user)
  likes: Relation<LikeEntity>[];

  @OneToMany(() => CommentEntity, (comment) => comment.user)
  comments: Relation<CommentEntity>[];

  @OneToMany(() => FollowEntity, (follow) => follow.follower)
  following: Relation<FollowEntity>[];

  @OneToMany(() => FollowEntity, (follow) => follow.following)
  followers: Relation<FollowEntity>[];

  // Phase 2 relations
  @OneToMany(() => StoryEntity, (story) => story.author)
  stories: Relation<StoryEntity>[];

  @OneToMany(() => HighlightEntity, (highlight) => highlight.user)
  highlights: Relation<HighlightEntity>[];

  // Phase 3 relations
  @OneToMany(() => BookmarkEntity, (bookmark) => bookmark.user)
  bookmarks: Relation<BookmarkEntity>[];
}
