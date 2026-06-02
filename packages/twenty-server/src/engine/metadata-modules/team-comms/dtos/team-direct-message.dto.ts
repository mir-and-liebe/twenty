import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { TeamChannelNotificationLevel } from 'src/engine/metadata-modules/team-comms/entities/team-channel-member.entity';

@ObjectType('TeamDirectMessage')
export class TeamDirectMessageDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => UUIDScalarType)
  participantUserWorkspaceId: string;

  @Field()
  participantName: string;

  @Field()
  participantEmail: string;

  @Field(() => Int)
  unreadCount: number;

  @Field(() => TeamChannelNotificationLevel)
  notificationLevel: TeamChannelNotificationLevel;

  @Field(() => String, { nullable: true })
  lastMessageBody: string | null;

  @Field(() => Date)
  updatedAt: Date;
}
