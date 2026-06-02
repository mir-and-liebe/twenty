import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('TeamMessageSearchResult')
export class TeamMessageSearchResultDTO {
  @Field(() => UUIDScalarType)
  id: string;

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
  body: string;

  @Field()
  matchType: string;

  @Field(() => String, { nullable: true })
  attachmentName: string | null;

  @Field(() => String, { nullable: true })
  attachmentUrl: string | null;

  @Field(() => Date)
  createdAt: Date;
}
