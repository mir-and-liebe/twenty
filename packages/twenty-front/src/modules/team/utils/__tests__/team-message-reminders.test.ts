import {
  getTeamMessageReminderDate,
  TEAM_MESSAGE_REMINDER_OPTIONS,
} from '@/team/utils/teamMessageReminders';

describe('team message reminders', () => {
  it('computes a relative reminder date from the selected option', () => {
    expect(
      getTeamMessageReminderDate({
        now: new Date('2026-06-01T10:00:00.000Z'),
        optionValue: '20-minutes',
      }).toISOString(),
    ).toBe('2026-06-01T10:20:00.000Z');
  });

  it('falls back to the default reminder option for unknown values', () => {
    expect(
      getTeamMessageReminderDate({
        now: new Date('2026-06-01T10:00:00.000Z'),
        optionValue: 'later',
      }).toISOString(),
    ).toBe('2026-06-01T11:00:00.000Z');
  });

  it('keeps every reminder option selectable by value', () => {
    expect(TEAM_MESSAGE_REMINDER_OPTIONS.map((option) => option.value)).toEqual(
      ['20-minutes', '1-hour', '3-hours', 'tomorrow'],
    );
  });
});
