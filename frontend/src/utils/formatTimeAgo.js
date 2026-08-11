/**
 * formatTimeAgo — consistent relative time formatting across the app.
 *
 * Rules:
 *   < 1 min          → "just now"
 *   1–59 min         → "Nm ago"
 *   1–23 h           → "Nh ago"
 *   1–30 days        → "Nd ago"
 *   1–6 months       → "Nm ago"   (months)
 *   > 6 months       → actual date, e.g. "15 Jan 2025"
 *
 * @param {Date|string|number|object} timestamp - anything new Date() can parse,
 *   or a Firestore Timestamp (has a .toDate() method)
 * @returns {string}
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';

  // Support Firestore Timestamps
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffSecs  = Math.floor(diffMs / 1000);
  const diffMins  = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays  = Math.floor(diffMs / 86_400_000);
  const diffMonths = Math.floor(diffDays / 30.44); // avg days per month

  if (diffSecs  <  60) return 'just now';
  if (diffMins  <  60) return `${diffMins}m ago`;
  if (diffHours <  24) return `${diffHours}h ago`;
  if (diffDays  <=  30) return `${diffDays}d ago`;
  if (diffMonths <= 6) return `${diffMonths}mo ago`;

  // Older than 6 months — show the actual date
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};
