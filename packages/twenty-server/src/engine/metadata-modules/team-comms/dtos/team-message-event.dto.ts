import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

export enum TeamMessageEventType {
  UPSERTED = 'UPSERTED',
  DELETED = 'DELETED',
}

registerEnumType(TeamMessageEventType, {
  name: 'TeamMessageEventType',
});

@ObjectType('TeamMessageEvent')
export class TeamMessageEventDTO {
  @Field(() => TeamMessageEventType)
  type: TeamMessageEventType;

  @Field()
  isNewMessage: boolean;

  @Field(() => UUIDScalarType)
  messageId: string;

  @Field(() => UUIDScalarType)
  authorUserWorkspaceId: string;

  @Field()
  authorName: string;

  @Field()
  body: string;

  @Field(() => UUIDScalarType, { nullable: true })
  channelId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  directMessageThreadId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  parentMessageId: string | null;
}
