import { Field, InputType, Int } from '@nestjs/graphql';

@InputType('TeamMessageAttachmentInput')
export class TeamMessageAttachmentInput {
  @Field()
  name: string;

  @Field()
  url: string;

  @Field(() => String, { nullable: true })
  mimeType: string | null;

  @Field(() => Int, { nullable: true })
  size: number | null;
}
