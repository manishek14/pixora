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
  Relation,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../users/user.entity';
import { CollectionItemEntity } from './collection-item.entity';

/**
 * A collection = a named folder the user organizes their bookmarked posts into.
 * (e.g. "Recipes", "Outfit ideas", "Travel inspo"). One user can have many
 * collections. A bookmarked post can belong to multiple collections (many-to-many).
 *
 * The `name` is unique per user (two collections by the same user can't share
 * a name). `coverPostId` is an optional cached cover for fast client rendering.
 */
@Entity('collections')
@Index(['userId', 'name'])
@ObjectType('Collection')
export class CollectionEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'userId' })
  @Field(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({ type: 'uuid' })
  @Index()
  @Field(() => ID)
  userId: string;

  @Column({ type: 'varchar', length: 60 })
  @Field()
  name: string;

  @Column({ type: 'text', nullable: true })
  @Field({ nullable: true })
  description?: string;

  /** Optional cached cover post ID (for client rendering). */
  @Column({ type: 'uuid', nullable: true })
  @Field(() => ID, { nullable: true })
  coverPostId?: string;

  @OneToMany(() => CollectionItemEntity, (item) => item.collection, {
    cascade: true,
  })
  @Field(() => [CollectionItemEntity], { nullable: true })
  items: Relation<CollectionItemEntity>[];
}
