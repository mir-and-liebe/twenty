import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('TeamMessageReminder')
export class TeamMessageReminderDTO {
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
  body: string;

  @Field(() => Date)
  remindAt: Date;

  @Field(() => Date)
  createdAt: Date;
}
