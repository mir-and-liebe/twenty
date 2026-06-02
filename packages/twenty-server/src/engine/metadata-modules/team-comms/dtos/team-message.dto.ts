import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { TeamMessageAttachmentDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-message-attachment.dto';
import { TeamMessageReactionDTO } from 'src/engine/metadata-modules/team-comms/dtos/team-message-reaction.dto';

@ObjectType('TeamMessage')
export class TeamMessageDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => UUIDScalarType, { nullable: true })
  channelId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  directMessageThreadId: string | null;

  @Field(() => UUIDScalarType)
  authorUserWorkspaceId: string;

  @Field()
  authorName: string;

  @Field(() => String, { nullable: true })
  conversationName: string | null;

  @Field()
  body: string;

  @Field()
  canEdit: boolean;

  @Field()
  canDelete: boolean;

  @Field(() => UUIDScalarType, { nullable: true })
  parentMessageId: string | null;

  @Field()
  isPinned: boolean;

  @Field()
  isSaved: boolean;

  @Field(() => Date, { nullable: true })
  pinnedAt: Date | null;

  @Field(() => UUIDScalarType, { nullable: true })
  pinnedByUserWorkspaceId: string | null;

  @Field(() => [TeamMessageReactionDTO])
  reactions: TeamMessageReactionDTO[];

  @Field(() => [TeamMessageAttachmentDTO])
  attachments: TeamMessageAttachmentDTO[];

  @Field(() => Int)
  replyCount: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
