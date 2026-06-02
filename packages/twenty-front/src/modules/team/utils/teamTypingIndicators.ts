type TeamTypingIndicatorLike = {
  name: string;
};

export const formatTeamTypingIndicatorText = (
  indicators: readonly TeamTypingIndicatorLike[],
) => {
  if (indicators.length === 0) {
    return null;
  }

  if (indicators.length === 1) {
    return `${indicators[0].name} is typing...`;
  }

  const visibleNames = indicators
    .slice(0, 2)
    .map((indicator) => indicator.name)
    .join(', ');

  if (indicators.length === 2) {
    return `${visibleNames} are typing...`;
  }

  return `${visibleNames} and ${indicators.length - 2} others are typing...`;
};
