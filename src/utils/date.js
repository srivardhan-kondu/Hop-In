import dayjs from 'dayjs';

export function formatDate(value) {
  if (!value) return '-';
  const date = value?.toDate ? value.toDate() : value;
  return dayjs(date).format('DD MMM YYYY');
}

export function formatTime(value) {
  if (!value) return '-';
  const date = value?.toDate ? value.toDate() : value;
  return dayjs(date).format('hh:mm A');
}
