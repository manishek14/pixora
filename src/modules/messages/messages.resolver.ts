import { Args, Mutation, Query, Resolver, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessageEntity } from './entities/message.entity';
import { MessageThreadEntity } from './entities/message-thread.entity';
import { SendMessageInput } from './dto/send-message.input';
import { ThreadListResult } from './thread-list-result';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => MessageEntity)
export class MessagesResolver {
  constructor(private readonly messages: MessagesService) {}

  @Query(() => ThreadListResult, {
    name: 'myThreads',
    description: 'لیست ترد پیام‌های کاربر فعلی (نزدیک‌ترین فعالیت اول)',
  })
  @UseGuards(GqlAuthGuard)
  async myThreads(
    @CurrentUser() user: UserEntity,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<ThreadListResult> {
    return this.messages.listThreads(user.id, limit, offset);
  }

  @Query(() => MessageThreadEntity, {
    name: 'thread',
    description: 'گرفتن یک ترد پیام با شناسه — فقط برای شرکت‌کنندگان ترد',
  })
  @UseGuards(GqlAuthGuard)
  async thread(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
    @Args('messageLimit', { type: () => Int, nullable: true, defaultValue: 50 })
    messageLimit: number,
  ): Promise<MessageThreadEntity> {
    return this.messages.getThread(user.id, id, messageLimit);
  }

  @Query(() => MessageThreadEntity, {
    name: 'threadWithUser',
    description: 'گرفتن یا ساختن ترد پیام با یک کاربر دیگر',
  })
  @UseGuards(GqlAuthGuard)
  async threadWithUser(
    @CurrentUser() user: UserEntity,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('messageLimit', { type: () => Int, nullable: true, defaultValue: 50 })
    messageLimit: number,
  ): Promise<MessageThreadEntity> {
    return this.messages.getThreadWithUser(user.id, userId, messageLimit);
  }

  @Query(() => Int, {
    name: 'unreadMessagesCount',
    description: 'تعداد پیام‌های خوانده‌نشده کاربر فعلی در همه ترد‌ها',
  })
  @UseGuards(GqlAuthGuard)
  async unreadMessagesCount(@CurrentUser() user: UserEntity): Promise<number> {
    return this.messages.getUnreadCount(user.id);
  }

  @Mutation(() => MessageEntity, {
    name: 'sendMessage',
    description: 'ارسال پیام به یک کاربر (ترد به‌صورت خودکار ساخته می‌شود)',
  })
  @UseGuards(GqlAuthGuard)
  async sendMessage(
    @CurrentUser() user: UserEntity,
    @Args('input') input: SendMessageInput,
  ): Promise<MessageEntity> {
    return this.messages.send(user.id, input);
  }

  @Mutation(() => Int, {
    name: 'markThreadRead',
    description: 'علامت‌گذاری همه پیام‌های ورودی یک ترد به‌عنوان خوانده‌شده. برمی‌گرداند: تعداد پیام‌های آپدیت‌شده',
  })
  @UseGuards(GqlAuthGuard)
  async markThreadRead(
    @CurrentUser() user: UserEntity,
    @Args('threadId', { type: () => ID }) threadId: string,
  ): Promise<number> {
    return this.messages.markThreadRead(user.id, threadId);
  }

  @Mutation(() => Boolean, {
    name: 'deleteMessage',
    description: 'حذف یکی از پیام‌های خود کاربر (فقط فرستنده می‌تواند حذف کند)',
  })
  @UseGuards(GqlAuthGuard)
  async deleteMessage(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.messages.deleteMessage(user.id, id);
  }
}
