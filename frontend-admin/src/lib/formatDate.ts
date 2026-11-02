export const toDateInputValue = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  if (typeof date === "string") return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
};

export const formatDate = (date: string | Date): string =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

export const isExpiringSoon = (date: string | Date, days = 7): boolean => {
  const diff = new Date(date).getTime() - Date.now();
  return diff > 0 && diff <= days * 24 * 60 * 60 * 1000;
};

export const isExpired = (date: string | Date): boolean => new Date(date).getTime() < Date.now();

export const timeAgo = (date: string | Date): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};
