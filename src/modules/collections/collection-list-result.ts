import { ObjectType, Field, Int } from '@nestjs/graphql';
import { CollectionEntity } from './collection.entity';

@ObjectType('CollectionListResult')
export class CollectionListResult {
  @Field(() => [CollectionEntity])
  items: CollectionEntity[];

  @Field(() => Int)
  total: number;
}
