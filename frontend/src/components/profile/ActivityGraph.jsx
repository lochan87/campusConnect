import React, { useMemo } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';

/**
 * Feature #15 — GitHub-style Activity Graph on the Profile page.
 * Converts an array of post objects (each with a createdAt date) into
 * the format expected by react-activity-calendar and renders the graph.
 *
 * Note: The profile API returns up to 10 recent posts. The graph will show
 * those activity days lit up within a 52-week window.
 */

function buildActivityData(posts = []) {
  // Count posts per ISO date string (YYYY-MM-DD)
  const countByDate = {};
  posts.forEach((post) => {
    if (!post.createdAt) return;
    let d;
    try {
      if (post.createdAt && post.createdAt.seconds) {
        // Firestore Timestamp object
        d = new Date(post.createdAt.seconds * 1000);
      } else {
        d = new Date(post.createdAt);
      }
      if (isNaN(d.getTime())) return;
    } catch {
      return;
    }
    const key = d.toISOString().slice(0, 10);
    countByDate[key] = (countByDate[key] || 0) + 1;
  });

  // Generate a 364-day window ending today (react-activity-calendar requires
  // the first and last entries to be the first/last day of their respective weeks)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start on a Sunday 363 days ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 363);

  const data = [];
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const count = countByDate[key] || 0;
    // level must be 0-4
    const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
    data.push({ date: key, count, level });
  }

  return data;
}

const ActivityGraph = ({ posts = [] }) => {
  const data = useMemo(() => buildActivityData(posts), [posts]);

  // Detect theme from <html> class
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  return (
    <div className="w-full overflow-x-auto pb-2">
      <ActivityCalendar
        data={data}
        colorScheme={isDark ? 'dark' : 'light'}
        theme={{
          light: ['#e0e7ff', '#a5b4fc', '#6366f1', '#4338ca', '#1e1b4b'],
          dark:  ['#1e293b', '#312e81', '#4338ca', '#6366f1', '#a5b4fc'],
        }}
        labels={{
          totalCount: '{{count}} posts in the last year',
          legend: { less: 'Fewer', more: 'More' },
        }}
        fontSize={11}
        blockSize={11}
        blockMargin={3}
        blockRadius={2}
        showWeekdayLabels
        hideTotalCount={false}
      />
    </div>
  );
};

export default ActivityGraph;
