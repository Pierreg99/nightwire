/**
 * NIGHTWIRE v2.0.1 — Game Bootstrap
 * Wires render, combat, mission, phone, assets, design and features.
 */

import { createRenderFoundation } from './renderBridge.js';
import { createMonitoring } from './monitoring.js';
import { createFeedbackSystem } from './feedback.js';
import { createColdCargoCampaign } from '../story/coldCargo.js';
import { createPhone } from '../ui/phone.mjs';
import { createHUD } from '../ui/hud.js';
import { createInteractionSystem } from '../ui/interaction.js';
import { createGameAssetLibrary } from '../assets/proceduralAssets.mjs';
import { createDesignSystem } from '../design/designSystem.mjs';
import { createFeatureRegistry } from '../features/featureRegistry.mjs';
import { bindAssetsToUIAndWorld } from './assetBinding.mjs';

export function createGameBootstrap({
  canvas,
  scene,
  camera,
  container,
  featureOverrides = {}
}) {
  const eventBus = createEventBusSafe();
  const monitoring = createMonitoring();
  const feedback = createFeedbackSystem();
  const features = createFeatureRegistry(featureOverrides);

  const render = createRenderFoundation({ canvas, scene, camera });
  const campaign = createColdCargoCampaign();
  const hud = createHUD({ container });

  const assets = features.isEnabled('assets.procedural')
    ? createGameAssetLibrary()
    : null;

  const phone = createPhone({ container, assets });
  const interaction = createInteractionSystem({ container });

  const design = features.isEnabled('design.system')
    ? createDesignSystem()
    : null;

  const assetBinding = bindAssetsToUIAndWorld({
    phone,
    scene,
    assets
  });

  function createEventBusSafe() {
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

  function createAsset(assetId) {
    if (!assets) return null;
    return assets[assetId]?.() || null;
  }

  function update(deltaTime) {
    const metrics = render.update(deltaTime);
    monitoring.trackPerformance(metrics?.averageFrameMs || 0);
    return metrics;
  }

  function dispose() {
    assetBinding.dispose();
    render.dispose();
    hud.dispose();
    phone.dispose();
    interaction.dispose();
    design?.dispose();
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
    features,
    design,
    assets,
    assetBinding,
    createAsset,
    update,
    dispose
  };
}
