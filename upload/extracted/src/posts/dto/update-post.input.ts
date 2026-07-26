import { Field, ID, InputType } from "@nestjs/graphql";
import { CreatePostInput } from "./create-post.input";

@InputType()
export class UpdatePostInput extends CreatePostInput {
    @Field(() => ID, { description : "شناسه پست برای بروزرسانی" })
    id! : string
}