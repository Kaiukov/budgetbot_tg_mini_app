// Shared currency helpers to keep UI and guards consistent
export const normalizeCurrency = (currency?: string | null): string => {
  const trimmed = currency?.trim();
  return trimmed ? trimmed.toUpperCase() : 'EUR';
};

export const needsConversion = (currency?: string | null): boolean => {
  return normalizeCurrency(currency) !== 'EUR';
};
