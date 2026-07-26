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

@Entity('likes')
@Unique(['userId', 'postId'])
@ObjectType('Like')
export class LikeEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.likes, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'userId' })
  @Field(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => PostEntity, (post) => post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Relation<PostEntity>;

  @Column({ type: 'uuid' })
  @Index()
  postId: string;
}
