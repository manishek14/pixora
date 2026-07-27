import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../../users/user.entity';
import { MessageThreadEntity } from './message-thread.entity';

/**
 * A single chat message in a thread. Belongs to one MessageThreadEntity.
 *
 * Read state is tracked per-message: when a recipient opens the thread,
 * the service flips `isRead = true` on all messages where they are NOT
 * the sender (i.e., incoming messages).
 */
@Entity('messages')
@Index(['threadId', 'createdAt'])
@Index(['threadId', 'isRead'])
@ObjectType('Message')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  threadId: string;

  @Column({ type: 'uuid' })
  @Index()
  senderId: string;

  /** Message body — required even if mediaUrls are present (one of text/media). */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  text?: string | null;

  /**
   * Optional media attachments stored as a simple-array (comma-separated).
   * URLs are stored as-is; clients resolve/transform them.
   */
  @Column({ type: 'simple-array', nullable: true })
  @Field(() => [String], { nullable: true })
  mediaUrls?: string[];

  @Column({ default: false })
  @Field()
  isRead: boolean;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  // ----- Relations -----

  @ManyToOne(() => MessageThreadEntity, (thread) => thread.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'threadId' })
  thread: Relation<MessageThreadEntity>;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'senderId' })
  @Field(() => UserEntity)
  sender: Relation<UserEntity>;
}
