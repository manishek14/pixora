import { Field, ID, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Posts {
    @Field(() => ID, { description : "" } )
    id! : string

    @Field(() => String, { description : "" } )
    title! : string

    @Field(() => String, { description : "" } )
    content! : string

    @Field(() => String, { description : "", nullable : true } )
    author? : string

    @Field(() => Boolean, { description : "", defaultValue : false } )
    published! : boolean

    @Field(() => String, { description : "" } )
    createdAt! : string

    @Field(() => String, { description : "", nullable : true} )
    updatedAt? : string
}