import { Args, Query, Resolver, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { SuggestionListResult } from './suggestion-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UserEntity } from '../users/user.entity';

@Resolver(() => SuggestionListResult)
export class SuggestionsResolver {
  constructor(private readonly suggestions: SuggestionsService) {}

  @Query(() => SuggestionListResult, {
    name: 'suggestUsers',
    description: 'پیشنهاد کاربران برای دنبال کردن (بر اساس دنبال‌کنندگان مشترک)',
  })
  @UseGuards(GqlAuthGuard)
  async suggestUsers(
    @CurrentUser() user: UserEntity,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<SuggestionListResult> {
    return this.suggestions.suggest(user.id, limit);
  }
}
