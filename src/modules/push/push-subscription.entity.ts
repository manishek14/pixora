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
import { UserEntity } from '../users/user.entity';

/**
 * A Web Push subscription for a user's device/browser.
 *
 * A user can have multiple subscriptions (phone, laptop, multiple browsers).
 * When sending a push, we iterate over all of them and silently skip any
 * that fail with a 410/404 (the subscription has been unsubscribed at the
 * browser level) — see PushService.sendPush.
 */
@Entity('push_subscriptions')
@Index(['userId', 'endpoint'], { unique: true })
@ObjectType('PushSubscription')
export class PushSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'userId' })
  @Field(() => UserEntity)
  user: Relation<UserEntity>;

  /**
   * The push service endpoint URL (e.g. https://fcm.googleapis.com/fcm/send/...).
   * Unique per (user, endpoint) — same browser registering twice just updates
   * the existing subscription.
   */
  @Column({ type: 'text' })
  @Field()
  endpoint: string;

  /** P-256 public key (base64url) — provided by the browser on subscribe. */
  @Column({ type: 'text' })
  @Field()
  p256dh: string;

  /** Auth secret (base64url) — provided by the browser on subscribe. */
  @Column({ type: 'text' })
  @Field()
  auth: string;

  /** Optional expiration timestamp (ms epoch) — browsers may set this. */
  @Column({ type: 'bigint', nullable: true })
  @Field(() => Number, { nullable: true })
  expirationTime?: number | null;

  @CreateDateColumn()
  @Field()
  createdAt: Date;
}
