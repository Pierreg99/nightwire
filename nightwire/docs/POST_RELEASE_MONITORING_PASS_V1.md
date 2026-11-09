# Post-Release Monitoring & Iteration Pass v1

## Purpose

This pass turns monitoring and feedback into an iteration loop.

It analyzes feedback, reviews performance and recommends the next action.

## Modules

- feedbackAnalyzer.js: feedback analysis and prioritization
- iterationPlanner.js: iteration planning and next-action recommendations

## Feedback categories

- bug
- performance
- gameplay
- visual
- ux

## Performance review

The planner checks average frame time against the 30 FPS target.

If frame time is above target, it recommends reducing render scale or quality tier.

## Iteration plan

The planner returns prioritized actions:

- Fix reported bugs
- Optimize performance
- Improve visual polish
- Improve UI and controls
- Continue polish and content

## Integration

Import createFeedbackAnalyzer and createIterationPlanner.

Analyze feedback entries and performance metrics, then generate an iteration plan.

## Next step

Use the iteration plan to select the next polish or content pass.
