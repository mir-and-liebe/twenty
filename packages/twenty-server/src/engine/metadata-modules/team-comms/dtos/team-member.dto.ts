import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('TeamMember')
export class TeamMemberDTO {
  @Field(() => UUIDScalarType)
  userWorkspaceId: string;

  @Field()
  name: string;

  @Field()
  email: string;
}
