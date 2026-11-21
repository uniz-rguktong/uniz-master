export function parseSafeDate(dateStr?: string) {
  if (!dateStr) return null;
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  const cleaned = dateStr.replace(/[()]/g, "").trim();
  const parts = cleaned.match(/(\d{1,2})[./-]([a-zA-Z]+|\d{1,2})[./-](\d{4})/);

  if (parts) {
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[3], 10);
    let month = 0;

    if (isNaN(parseInt(parts[2], 10))) {
      const mStr = parts[2].toLowerCase();
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      month = months.findIndex(m => mStr.startsWith(m));
      if (month === -1) month = 0;
    } else {
      month = parseInt(parts[2], 10) - 1; // 0-indexed month
    }

    d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

const NOTICE_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatNoticeDay(date: Date) {
  return `${date.getDate()} ${NOTICE_MONTHS[date.getMonth()]}`;
}
