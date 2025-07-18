// Simple RTL utility hook
export const useRTL = () => {
  const isRTL = true; // Hebrew is RTL

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('he-IL').format(dateObj);
  };

  return {
    isRTL,
    formatCurrency,
    formatDate
  };
};
