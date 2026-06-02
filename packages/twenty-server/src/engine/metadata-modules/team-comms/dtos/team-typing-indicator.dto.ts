import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('TeamTypingIndicator')
export class TeamTypingIndicatorDTO {
  @Field(() => UUIDScalarType)
  userWorkspaceId: string;

  @Field()
  name: string;

  @Field(() => UUIDScalarType, { nullable: true })
  channelId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  directMessageThreadId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  parentMessageId: string | null;

  @Field(() => Date)
  expiresAt: Date;
}
