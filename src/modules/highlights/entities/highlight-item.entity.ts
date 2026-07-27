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
import { Field, ID, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import { HighlightEntity } from './highlight.entity';

export enum HighlightMediaType {
  Image = 'image',
  Video = 'video',
}

registerEnumType(HighlightMediaType, {
  name: 'HighlightMediaType',
  description: 'image | video',
});

/**
 * A single media item inside a highlight. The media is copied from the source
 * story (url + type + caption) so the highlight survives story expiration.
 */
@Entity('highlight_items')
@Index(['highlightId'])
@ObjectType('HighlightItem')
export class HighlightItemEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'uuid' })
  highlightId: string;

  @ManyToOne(() => HighlightEntity, (highlight) => highlight.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'highlightId' })
  highlight: Relation<HighlightEntity>;

  @Column()
  @Field()
  mediaUrl: string;

  @Column({ type: 'varchar', length: 20 })
  @Field(() => HighlightMediaType)
  mediaType: HighlightMediaType;

  @Column({ type: 'text', nullable: true })
  @Field({ nullable: true })
  caption?: string;

  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  order: number;

  @CreateDateColumn()
  @Field()
  createdAt: Date;
}
