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

@Entity('follows')
@Unique(['followerId', 'followingId'])
@Index(['followerId', 'followingId'])
@ObjectType('Follow')
export class FollowEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  // The user who follows
  @ManyToOne(() => UserEntity, (user) => user.following, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'followerId' })
  @Field(() => UserEntity)
  follower: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  followerId: string;

  // The user being followed
  @ManyToOne(() => UserEntity, (user) => user.followers, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'followingId' })
  @Field(() => UserEntity)
  following: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  followingId: string;

  @Column({ default: false })
  @Field()
  isAccepted: boolean;

  @Column({ default: false })
  @Field()
  isCloseFriend: boolean;
}
