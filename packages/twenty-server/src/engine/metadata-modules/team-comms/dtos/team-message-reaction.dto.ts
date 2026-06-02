import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('TeamMessageReaction')
export class TeamMessageReactionDTO {
  @Field()
  emoji: string;

  @Field(() => Int)
  count: number;

  @Field()
  hasReacted: boolean;
}
