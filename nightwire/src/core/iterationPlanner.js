/**
 * Machala Post-Release Monitoring & Iteration Pass v1
 * Iteration planning and next-action recommendations.
 */

export function createIterationPlanner() {
  function plan({ feedbackSummary = {}, performanceMetrics = {} } = {}) {
    const actions = [];

    if (feedbackSummary.categories?.bug > 0) {
      actions.push({
        priority: 'high',
        action: 'Fix reported bugs',
        reason: 'Bug reports detected'
      });
    }

    if (feedbackSummary.categories?.performance > 0) {
      actions.push({
        priority: 'high',
        action: 'Optimize performance',
        reason: 'Performance complaints detected'
      });
    }

    if (performanceMetrics.averageFrameMs > 33.3) {
      actions.push({
        priority: 'high',
        action: 'Reduce render scale or quality tier',
        reason: 'Frame time above 30 FPS target'
      });
    }

    if (feedbackSummary.categories?.visual > 0) {
      actions.push({
        priority: 'medium',
        action: 'Improve visual polish',
        reason: 'Visual feedback detected'
      });
    }

    if (feedbackSummary.categories?.ux > 0) {
      actions.push({
        priority: 'medium',
        action: 'Improve UI and controls',
        reason: 'UX feedback detected'
      });
    }

    if (!actions.length) {
      actions.push({
        priority: 'low',
        action: 'Continue polish and content',
        reason: 'No critical issues detected'
      });
    }

    return {
      actions,
      nextPass: actions[0]?.action || 'Continue polish and content'
    };
  }

  return {
    plan
  };
}
