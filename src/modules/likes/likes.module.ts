import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikeEntity } from './like.entity';
import { LikesService } from './likes.service';
import { LikesResolver } from './likes.resolver';
import { PostsModule } from '../posts/posts.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([LikeEntity]), PostsModule, AuthModule],
  providers: [LikesService, LikesResolver],
  exports: [LikesService],
})
export class LikesModule {}
