import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { TeamNotificationPreference } from 'src/engine/metadata-modules/team-comms/entities/team-presence.entity';

registerEnumType(TeamNotificationPreference, {
  name: 'TeamNotificationPreference',
});

@ObjectType('TeamPresence')
export class TeamPresenceDTO {
  @Field(() => UUIDScalarType)
  userWorkspaceId: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  isOnline: boolean;

  @Field()
  isCurrentUser: boolean;

  @Field(() => Date)
  lastSeenAt: Date;

  @Field(() => String, { nullable: true })
  statusText: string | null;

  @Field(() => String, { nullable: true })
  statusEmoji: string | null;

  @Field(() => TeamNotificationPreference)
  notificationPreference: TeamNotificationPreference;

  @Field(() => String, { nullable: true })
  notificationQuietHoursStart: string | null;

  @Field(() => String, { nullable: true })
  notificationQuietHoursEnd: string | null;
}
