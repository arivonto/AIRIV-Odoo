export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatWIBDate(dateString: string | Date): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function sanitizeWhatsApp(phone: string): string {
  if (!phone) return '';
  // Remove all non-numeric characters
  let sanitized = phone.replace(/\D/g, '');
  // Replace leading 0 with 62
  if (sanitized.startsWith('0')) {
    sanitized = '62' + sanitized.substring(1);
  } else if (!sanitized.startsWith('62')) {
    // If it doesn't start with 62 or 0, assume it needs 62
    sanitized = '62' + sanitized;
  }
  return sanitized;
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
