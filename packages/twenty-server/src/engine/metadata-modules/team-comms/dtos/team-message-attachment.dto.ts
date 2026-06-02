import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('TeamMessageAttachment')
export class TeamMessageAttachmentDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  name: string;

  @Field()
  url: string;

  @Field(() => String, { nullable: true })
  mimeType: string | null;

  @Field(() => Int, { nullable: true })
  size: number | null;

  @Field(() => Date)
  createdAt: Date;
}
