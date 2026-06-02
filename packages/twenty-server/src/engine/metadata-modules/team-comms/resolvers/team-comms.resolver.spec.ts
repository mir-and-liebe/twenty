import { readFileSync } from 'fs';
import path from 'path';

describe('TeamCommsResolver', () => {
  describe('uploadTeamMessageAttachment', () => {
    it('caps upload stream buffering at the Team Comms attachment limit', () => {
      const source = readFileSync(
        path.join(
          process.cwd(),
          'packages/twenty-server/src/engine/metadata-modules/team-comms/resolvers/team-comms.resolver.ts',
        ),
        'utf8',
      );
      const uploadSource = source.slice(
        source.indexOf('async uploadTeamMessageAttachment('),
        source.indexOf('  @Mutation(() => TeamChannelDTO)'),
      );

      expect(uploadSource).toContain('streamToBuffer(');
      expect(uploadSource).toContain('TEAM_MESSAGE_ATTACHMENT_MAX_SIZE_BYTES');
      expect(uploadSource).toContain('Attachment is too large.');
    });
  });
});
