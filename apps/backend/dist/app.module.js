"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const graphql_1 = require("@nestjs/graphql");
const apollo_1 = require("@nestjs/apollo");
const path_1 = require("path");
const schedule_1 = require("@nestjs/schedule");
const env_validation_1 = require("./config/env.validation");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const posts_module_1 = require("./modules/posts/posts.module");
const likes_module_1 = require("./modules/likes/likes.module");
const comments_module_1 = require("./modules/comments/comments.module");
const follows_module_1 = require("./modules/follows/follows.module");
const feed_module_1 = require("./modules/feed/feed.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
                validationSchema: env_validation_1.envValidation,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const type = (config.get('DB_TYPE') || 'better-sqlite3');
                    const isPostgres = type === 'postgres';
                    return {
                        type,
                        database: isPostgres
                            ? config.get('DB_NAME', 'lenz')
                            : config.get('DB_PATH', (0, path_1.join)(process.cwd(), 'data', 'lenz.db')),
                        host: config.get('DB_HOST', 'localhost'),
                        port: config.get('DB_PORT', 5432),
                        username: config.get('DB_USER', 'postgres'),
                        password: config.get('DB_PASS', 'postgres'),
                        entities: [(0, path_1.join)(__dirname, '**', '*.entity.{ts,js}')],
                        synchronize: config.get('NODE_ENV') !== 'production',
                        logging: config.get('DB_LOG') === 'true',
                    };
                },
            }),
            graphql_1.GraphQLModule.forRootAsync({
                driver: apollo_1.ApolloDriver,
                inject: [config_1.ConfigService],
                useFactory: () => ({
                    autoSchemaFile: (0, path_1.join)(process.cwd(), 'src/schema.gql'),
                    playground: true,
                    introspection: true,
                    context: ({ req, res }) => ({ req, res }),
                    cors: { origin: true, credentials: true },
                }),
            }),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            posts_module_1.PostsModule,
            likes_module_1.LikesModule,
            comments_module_1.CommentsModule,
            follows_module_1.FollowsModule,
            feed_module_1.FeedModule,
            uploads_module_1.UploadsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map