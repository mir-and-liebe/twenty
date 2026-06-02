import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

export enum TeamInboxItemType {
  CHANNEL = 'channel',
  DIRECT_MESSAGE = 'directMessage',
  MENTION = 'mention',
  THREAD = 'thread',
}

registerEnumType(TeamInboxItemType, {
  name: 'TeamInboxItemType',
});

@ObjectType('TeamInboxItem')
export class TeamInboxItemDTO {
  @Field(() => TeamInboxItemType)
  type: TeamInboxItemType;

  @Field()
  id: string;

  @Field(() => UUIDScalarType, { nullable: true })
  channelId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  directMessageThreadId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  mentionId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  messageId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  parentMessageId: string | null;

  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  subtitle: string | null;

  @Field(() => Int)
  unreadCount: number;

  @Field(() => Date)
  updatedAt: Date;
}
