import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { TeamChannelNotificationLevel } from 'src/engine/metadata-modules/team-comms/entities/team-channel-member.entity';
import { TeamChannelVisibility } from 'src/engine/metadata-modules/team-comms/entities/team-channel.entity';

registerEnumType(TeamChannelVisibility, {
  name: 'TeamChannelVisibility',
});

@ObjectType('TeamChannel')
export class TeamChannelDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => TeamChannelVisibility)
  visibility: TeamChannelVisibility;

  @Field(() => Int)
  unreadCount: number;

  @Field()
  isMember: boolean;

  @Field(() => TeamChannelNotificationLevel, { nullable: true })
  notificationLevel: TeamChannelNotificationLevel | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
