import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Field, ID, ObjectType, Int } from '@nestjs/graphql';
import { UserEntity } from '../users/user.entity';

@Entity('posts')
@ObjectType('Post')
export class PostEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'text', nullable: true })
  @Field({ nullable: true })
  caption?: string;

  @Column({ type: 'simple-array', default: '' })
  @Field(() => [String])
  mediaUrls: string[];

  @Column({ type: 'simple-array', default: '' })
  @Field(() => [String])
  hashtags: string[];

  @Column({ type: 'simple-array', default: '' })
  @Field(() => [String])
  mentions: string[];

  @Column({ type: 'varchar', nullable: true })
  @Field({ nullable: true })
  location?: string;

  @Column({ default: false })
  @Field()
  isReel: boolean;

  // Reel-specific fields (only populated when isReel = true)
  @Column({ type: 'varchar', length: 512, nullable: true })
  @Field({ nullable: true })
  videoUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field({ nullable: true })
  audioTrack?: string;

  @Column({ type: 'int', nullable: true })
  @Field(() => Int, { nullable: true })
  durationSeconds?: number;

  @Column({ default: 0 })
  @Field(() => Int)
  viewsCount: number;

  @Column({ default: 0 })
  @Field(() => Int)
  sharesCount: number;

  @Column({ default: 0 })
  @Field(() => Int)
  likesCount: number;

  @Column({ default: 0 })
  @Field(() => Int)
  commentsCount: number;

  @Column({ default: false })
  @Field()
  archived: boolean;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.posts, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'authorId' })
  @Field(() => UserEntity)
  author: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  authorId: string;
}
