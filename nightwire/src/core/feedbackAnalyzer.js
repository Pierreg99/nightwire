/**
 * Machala Post-Release Monitoring & Iteration Pass v1
 * Feedback analysis and prioritization.
 */

const KEYWORDS = {
  bug: ['bug', 'crash', 'error', 'broken', 'stuck'],
  performance: ['slow', 'lag', 'fps', 'performance', 'stutter'],
  gameplay: ['weapon', 'enemy', 'mission', 'combat', 'vehicle'],
  visual: ['light', 'texture', 'neon', 'fog', 'graphics'],
  ux: ['hud', 'phone', 'control', 'touch', 'menu']
};

export function createFeedbackAnalyzer() {
  function analyze(entries = []) {
    const summary = {
      total: entries.length,
      categories: {
        bug: 0,
        performance: 0,
        gameplay: 0,
        visual: 0,
        ux: 0
      },
      averageRating: 0,
      topIssues: []
    };

    let ratingSum = 0;
    let ratingCount = 0;

    entries.forEach((entry) => {
      const text = (entry.message || '').toLowerCase();

      Object.keys(KEYWORDS).forEach((category) => {
        if (KEYWORDS[category].some((keyword) => text.includes(keyword))) {
          summary.categories[category] += 1;
        }
      });

      if (typeof entry.rating === 'number') {
        ratingSum += entry.rating;
        ratingCount += 1;
      }
    });

    if (ratingCount) {
      summary.averageRating = ratingSum / ratingCount;
    }

    summary.topIssues = Object.entries(summary.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));

    return summary;
  }

  return {
    analyze
  };
}
