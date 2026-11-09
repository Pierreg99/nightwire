/**
 * Machala Integration & Wiring Pass v1
 * Game bootstrap wiring render, combat, mission and phone.
 */

import { createRenderFoundation } from './renderBridge.js';
import { createMonitoring } from './monitoring.js';
import { createFeedbackSystem } from './feedback.js';
import { createColdCargoCampaign } from '../story/coldCargo.js';
import { createPhone } from '../ui/phone.js';
import { createHUD } from '../ui/hud.js';
import { createInteractionSystem } from '../ui/interaction.js';

export function createGameBootstrap({ canvas, scene, camera, container }) {
  const eventBus = createEventBusSafe();
  const monitoring = createMonitoring();
  const feedback = createFeedbackSystem();

  const render = createRenderFoundation({ canvas, scene, camera });
  const campaign = createColdCargoCampaign();
  const hud = createHUD({ container });
  const phone = createPhone({ container });
  const interaction = createInteractionSystem({ container });

  function createEventBusSafe() {
    // Local import avoided to keep bootstrap self-contained.
    const listeners = new Map();

    return {
      on(event, listener) {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(listener);
        return () => listeners.get(event).delete(listener);
      },
      emit(event, payload = {}) {
        listeners.get(event)?.forEach((listener) => listener(payload));
      }
    };
  }

  function wire() {
    eventBus.on('mission:start', () => {
      monitoring.track('mission:start', { mission: 'cold-cargo' });
      phone.addMessage('Job: Intercept - Warehouse 09.');
    });

    eventBus.on('beat:complete', ({ payload }) => {
      monitoring.track('beat:complete', { beat: payload.beat?.id });
    });

    eventBus.on('mission:complete', () => {
      monitoring.track('mission:complete', { mission: 'cold-cargo' });
      phone.addMessage('Extraction complete.');
    });

    eventBus.on('mission:failed', ({ payload }) => {
      monitoring.track('mission:failed', { reason: payload.reason });
    });
  }

  wire();

  function update(deltaTime) {
    const metrics = render.update(deltaTime);
    monitoring.trackPerformance(metrics?.averageFrameMs || 0);
    return metrics;
  }

  function dispose() {
    render.dispose();
    hud.dispose();
    phone.dispose();
    interaction.dispose();
  }

  return {
    eventBus,
    monitoring,
    feedback,
    render,
    campaign,
    hud,
    phone,
    interaction,
    update,
    dispose
  };
}
