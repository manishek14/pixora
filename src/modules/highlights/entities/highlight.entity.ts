import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../../users/user.entity';
import { HighlightItemEntity } from './highlight-item.entity';

/**
 * A highlight is a permanent collection of media (originally posted as stories)
 * shown on the user's profile. The media is copied into HighlightItem rows so
 * that even after the source story expires and is deleted, the highlight keeps
 * the media reference intact.
 */
@Entity('highlights')
@Index(['userId'])
@ObjectType('Highlight')
export class HighlightEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.highlights, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  @Field(() => UserEntity)
  user: Relation<UserEntity>;

  @Column({ length: 50 })
  @Field()
  title: string;

  @Column({ nullable: true, length: 255 })
  @Field({ nullable: true })
  coverUrl?: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;

  @OneToMany(() => HighlightItemEntity, (item) => item.highlight, {
    cascade: true,
    eager: true,
  })
  @Field(() => [HighlightItemEntity])
  items: Relation<HighlightItemEntity>[];
}
