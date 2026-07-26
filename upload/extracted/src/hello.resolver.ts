import { Query, Resolver } from "@nestjs/graphql";

@Resolver()
export class HelloResolver {
    @Query(() => String, {
        name : "hello"
    })
    getHello() : string {
        return "hello world"
    }
}