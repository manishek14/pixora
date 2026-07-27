import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';

import { envValidation } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { LikesModule } from './modules/likes/likes.module';
import { CommentsModule } from './modules/comments/comments.module';
import { FollowsModule } from './modules/follows/follows.module';
import { FeedModule } from './modules/feed/feed.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { StoriesModule } from './modules/stories/stories.module';
import { HighlightsModule } from './modules/highlights/highlights.module';
import { ReelsModule } from './modules/reels/reels.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { ExploreModule } from './modules/explore/explore.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: envValidation,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const type = (config.get<string>('DB_TYPE') || 'better-sqlite3') as
          | 'postgres'
          | 'sqlite'
          | 'better-sqlite3';
        const isPostgres = type === 'postgres';
        return {
          type,
          database: isPostgres
            ? config.get<string>('DB_NAME', 'lenz')
            : config.get<string>('DB_PATH', join(process.cwd(), 'data', 'lenz.db')),
          host: config.get<string>('DB_HOST', 'localhost'),
          port: config.get<number>('DB_PORT', 5432),
          username: config.get<string>('DB_USER', 'postgres'),
          password: config.get<string>('DB_PASS', 'postgres'),
          entities: [join(__dirname, '**', '*.entity.{ts,js}')],
          synchronize: config.get<string>('NODE_ENV') !== 'production',
          logging: config.get<string>('DB_LOG') === 'true',
        };
      },
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: () => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        playground: true,
        introspection: true,
        context: ({ req, res }) => ({ req, res }),
        cors: { origin: true, credentials: true },
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    PostsModule,
    LikesModule,
    CommentsModule,
    FollowsModule,
    FeedModule,
    UploadsModule,
    StoriesModule,
    HighlightsModule,
    ReelsModule,
    BookmarksModule,
    ExploreModule,
  ],
})
export class AppModule {}
