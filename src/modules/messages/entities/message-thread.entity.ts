import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
  Relation,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../../users/user.entity';
import { MessageEntity } from './message.entity';

/**
 * A 1-on-1 chat thread between two users.
 *
 * To prevent duplicate threads between the same pair (A→B and B→A), we
 * store participants as `userAId` and `userBId` where `userAId < userBId`
 * lexicographically. The service normalizes the order before insert.
 *
 * The unique constraint on (userAId, userBId) guarantees one thread per pair.
 */
@Entity('message_threads')
@Unique(['userAId', 'userBId'])
@Index(['userAId'])
@Index(['userBId'])
@ObjectType('MessageThread')
export class MessageThreadEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  /** One of the two participants (always the lexicographically smaller UUID). */
  @Column({ type: 'uuid' })
  userAId: string;

  /** The other participant (always the lexicographically larger UUID). */
  @Column({ type: 'uuid' })
  userBId: string;

  /** Timestamp of the most recent message — used for thread ordering. */
  @Column({ nullable: true })
  @Field({ nullable: true })
  lastMessageAt: Date;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;

  // ----- Relations (eager loaded for GraphQL resolver convenience) -----

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'userAId' })
  @Field(() => UserEntity)
  userA: Relation<UserEntity>;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'userBId' })
  @Field(() => UserEntity)
  userB: Relation<UserEntity>;

  @OneToMany(() => MessageEntity, (message) => message.thread)
  @Field(() => [MessageEntity], { nullable: true })
  messages: Relation<MessageEntity>[];
}
