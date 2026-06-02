import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { TeamChannelNotificationLevel } from 'src/engine/metadata-modules/team-comms/entities/team-channel-member.entity';

@ObjectType('TeamDirectMessageNotificationSetting')
export class TeamDirectMessageNotificationSettingDTO {
  @Field(() => UUIDScalarType)
  directMessageThreadId: string;

  @Field(() => UUIDScalarType)
  userWorkspaceId: string;

  @Field(() => TeamChannelNotificationLevel)
  notificationLevel: TeamChannelNotificationLevel;
}
