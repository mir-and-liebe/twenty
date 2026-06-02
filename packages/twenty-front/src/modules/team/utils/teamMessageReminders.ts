const MINUTE_IN_MS = 60 * 1000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;

export const TEAM_MESSAGE_REMINDER_OPTIONS = [
  {
    delayMs: 20 * MINUTE_IN_MS,
    label: '20 min',
    value: '20-minutes',
  },
  {
    delayMs: HOUR_IN_MS,
    label: '1 hour',
    value: '1-hour',
  },
  {
    delayMs: 3 * HOUR_IN_MS,
    label: '3 hours',
    value: '3-hours',
  },
  {
    delayMs: 24 * HOUR_IN_MS,
    label: 'Tomorrow',
    value: 'tomorrow',
  },
] as const;

export type TeamMessageReminderOptionValue =
  (typeof TEAM_MESSAGE_REMINDER_OPTIONS)[number]['value'];

export const DEFAULT_TEAM_MESSAGE_REMINDER_OPTION_VALUE =
  '1-hour' satisfies TeamMessageReminderOptionValue;

type GetTeamMessageReminderDateArgs = {
  now: Date;
  optionValue: string;
};

export const getTeamMessageReminderDate = ({
  now,
  optionValue,
}: GetTeamMessageReminderDateArgs) => {
  const option =
    TEAM_MESSAGE_REMINDER_OPTIONS.find(
      (reminderOption) => reminderOption.value === optionValue,
    ) ??
    TEAM_MESSAGE_REMINDER_OPTIONS.find(
      (reminderOption) =>
        reminderOption.value === DEFAULT_TEAM_MESSAGE_REMINDER_OPTION_VALUE,
    ) ??
    TEAM_MESSAGE_REMINDER_OPTIONS[0];

  return new Date(now.getTime() + option.delayMs);
};
