import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionEntity } from './collection.entity';
import { CollectionItemEntity } from './collection-item.entity';
import { PostEntity } from '../posts/post.entity';
import { CollectionsService } from './collections.service';
import { CollectionsResolver } from './collections.resolver';
import { CollectionListResult } from './collection-list-result';

@Module({
  imports: [
    TypeOrmModule.forFeature([CollectionEntity, CollectionItemEntity, PostEntity]),
  ],
  providers: [CollectionsService, CollectionsResolver, CollectionListResult],
  exports: [CollectionsService],
})
export class CollectionsModule {}
