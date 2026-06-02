import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import {
  TeamChannelMemberRole,
  TeamChannelNotificationLevel,
} from 'src/engine/metadata-modules/team-comms/entities/team-channel-member.entity';

registerEnumType(TeamChannelMemberRole, {
  name: 'TeamChannelMemberRole',
});

registerEnumType(TeamChannelNotificationLevel, {
  name: 'TeamChannelNotificationLevel',
});

@ObjectType('TeamChannelMember')
export class TeamChannelMemberDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => UUIDScalarType)
  channelId: string;

  @Field(() => UUIDScalarType)
  userWorkspaceId: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => TeamChannelMemberRole)
  role: TeamChannelMemberRole;

  @Field(() => TeamChannelNotificationLevel)
  notificationLevel: TeamChannelNotificationLevel;

  @Field()
  isCurrentUser: boolean;

  @Field(() => Date)
  createdAt: Date;
}
