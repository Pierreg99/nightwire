# Monitoring & Feedback Pass v1

## Purpose

This pass adds observability to NIGHTWIRE.

It tracks errors, gameplay events and performance metrics, and collects player feedback locally.

## Modules

- monitoring.js: error tracking, event buffer and performance metrics
- feedback.js: feedback collection and local persistence

## Monitoring

The monitoring system tracks gameplay events, errors with stack and context, frame-time samples, average frame time, FPS and p95 frame time.

## Feedback

The feedback system stores feedback type, message, rating, context and timestamp.

Feedback is persisted locally and can later be exported or sent to a backend.

## Integration

Import createMonitoring and createFeedbackSystem from the core folder.

Create both systems at boot, then call monitoring.track for gameplay events, monitoring.captureError for errors and monitoring.trackPerformance each frame.

## Next step

Connect monitoring to the render foundation, combat manager, mission manager and phone UI. Then add a feedback prompt after mission completion.
