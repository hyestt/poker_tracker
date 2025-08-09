export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekDay = weekDays[date.getDay()];
    return weekDay + ', ' + date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Unknown date';
  }
};
