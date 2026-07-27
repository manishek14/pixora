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
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { UserEntity } from '../../users/user.entity';

/**
 * Notification types — every event that creates a notification in the system.
 * Used by Likes/Comments/Follows/Stories services to push notifications
 * when an action affects another user.
 */
export enum NotificationType {
  Like = 'like',
  Comment = 'comment',
  Follow = 'follow',
  StoryView = 'story_view',
  StoryReaction = 'story_reaction',
  ReelView = 'reel_view',
  Mention = 'mention',
  System = 'system',
}

registerEnumType(NotificationType, { name: 'NotificationType' });

/**
 * Type of the entity the notification points at — lets the client render
 * a deep link ("@bob liked your post" → tap → open PostScreen).
 */
export enum NotificationEntityType {
  Post = 'post',
  Reel = 'reel',
  Story = 'story',
  Comment = 'comment',
  User = 'user',
  Message = 'message',
}

registerEnumType(NotificationEntityType, { name: 'NotificationEntityType' });

@Entity('notifications')
@Index(['recipientId', 'createdAt'])
@ObjectType('Notification')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  /** User who will see this notification in their feed. */
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'recipientId' })
  @Field(() => UserEntity)
  recipient: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  @Index()
  recipientId: string;

  /** User who performed the action (null for system notifications). */
  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true, eager: true })
  @JoinColumn({ name: 'actorId' })
  @Field(() => UserEntity, { nullable: true })
  actor?: Relation<UserEntity> | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  actorId?: string | null;

  @Column({ type: 'varchar' })
  @Field(() => NotificationType)
  type: NotificationType;

  /** Optional human-readable text (for system notifications or mention previews). */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  text?: string;

  /** Type of the related entity, used for client-side deep-linking. */
  @Column({ type: 'varchar', nullable: true })
  @Field(() => NotificationEntityType, { nullable: true })
  entityType?: NotificationEntityType | null;

  /** UUID of the related entity. */
  @Column({ type: 'uuid', nullable: true })
  @Field(() => ID, { nullable: true })
  entityId?: string | null;

  @Column({ default: false })
  @Field()
  isRead: boolean;

  @CreateDateColumn()
  @Field()
  createdAt: Date;
}
