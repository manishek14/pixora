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
import { CollectionEntity } from './collection.entity';
import { PostEntity } from '../posts/post.entity';

/**
 * Many-to-many bridge between a Collection and a Post.
 *
 * One row per (collectionId, postId) — adding the same post to the same
 * collection twice is a no-op (handled at the service layer).
 */
@Entity('collection_items')
@Unique(['collectionId', 'postId'])
@Index(['collectionId', 'postId'])
@ObjectType('CollectionItem')
export class CollectionItemEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @ManyToOne(() => CollectionEntity, (collection) => collection.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collectionId' })
  @Field(() => CollectionEntity)
  collection: Relation<CollectionEntity>;

  @Column({ type: 'uuid' })
  @Index()
  @Field(() => ID)
  collectionId: string;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  @Field(() => PostEntity)
  post: Relation<PostEntity>;

  @Column({ type: 'uuid' })
  @Index()
  @Field(() => ID)
  postId: string;
}
