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
  OneToMany,
} from 'typeorm';
import { Field, ID, ObjectType, Int } from '@nestjs/graphql';
import { UserEntity } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';

@Entity('comments')
@ObjectType('Comment')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'text' })
  @Field()
  text: string;

  @Column({ default: 0 })
  @Field(() => Int)
  likesCount: number;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.comments, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'userId' })
  @Field(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Relation<PostEntity>;

  @Column({ type: 'uuid' })
  @Index()
  postId: string;

  // Self-referencing parent/children for threaded replies
  @ManyToOne(() => CommentEntity, (c) => c.replies, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Relation<CommentEntity> | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  parentId: string | null;

  @OneToMany(() => CommentEntity, (c) => c.parent)
  @Field(() => [CommentEntity], { nullable: true })
  replies: Relation<CommentEntity>[];
}
