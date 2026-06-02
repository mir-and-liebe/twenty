import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('TeamFile')
export class TeamFileDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => UUIDScalarType)
  messageId: string;

  @Field(() => UUIDScalarType, { nullable: true })
  channelId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  directMessageThreadId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  parentMessageId: string | null;

  @Field()
  conversationName: string;

  @Field()
  conversationType: string;

  @Field()
  authorName: string;

  @Field()
  name: string;

  @Field()
  url: string;

  @Field(() => String, { nullable: true })
  mimeType: string | null;

  @Field(() => Int, { nullable: true })
  size: number | null;

  @Field(() => Date)
  createdAt: Date;
}
