/**
 * NIGHTWIRE v2.0.1 — Design System
 * Night-city visual language, tokens and UI components.
 */

export const designTokens = {
  color: {
    void: '#05070d',
    surface: '#0d131e',
    surfaceRaised: '#141c29',
    line: '#233044',
    text: '#e8f4ff',
    textMuted: '#8fa3ba',
    neonCyan: '#38e8ff',
    neonMagenta: '#ff4d6d',
    neonAmber: '#ffb347',
    neonViolet: '#b388ff',
    success: '#4dffd2',
    danger: '#ff5c5c'
  },
  radius: {
    sm: '6px',
    md: '12px',
    lg: '20px'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px'
  },
  typography: {
    display: "'Rajdhani', 'Arial Narrow', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace"
  }
};

export function createDesignSystem({ root = document.body } = {}) {
  const style = document.createElement('style');
  style.id = 'nightwire-design-system';

  style.textContent = `
    :root {
      --nw-void: ${designTokens.color.void};
      --nw-surface: ${designTokens.color.surface};
      --nw-surface-raised: ${designTokens.color.surfaceRaised};
      --nw-line: ${designTokens.color.line};
      --nw-text: ${designTokens.color.text};
      --nw-text-muted: ${designTokens.color.textMuted};
      --nw-neon-cyan: ${designTokens.color.neonCyan};
      --nw-neon-magenta: ${designTokens.color.neonMagenta};
      --nw-neon-amber: ${designTokens.color.neonAmber};
      --nw-neon-violet: ${designTokens.color.neonViolet};
      --nw-success: ${designTokens.color.success};
      --nw-danger: ${designTokens.color.danger};
      --nw-font-display: ${designTokens.typography.display};
      --nw-font-body: ${designTokens.typography.body};
      --nw-font-mono: ${designTokens.typography.mono};
    }

    body {
      background: var(--nw-void);
      color: var(--nw-text);
      font-family: var(--nw-font-body);
    }

    .nw-panel {
      background: color-mix(in srgb, var(--nw-surface) 88%, transparent);
      border: 1px solid var(--nw-line);
      border-radius: var(--nw-radius, 12px);
      box-shadow: 0 0 24px rgba(56, 232, 255, 0.08);
    }

    .nw-title {
      font-family: var(--nw-font-display);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .nw-neon {
      color: var(--nw-neon-cyan);
      text-shadow: 0 0 12px rgba(56, 232, 255, 0.55);
    }

    .nw-button {
      background: var(--nw-surface-raised);
      border: 1px solid var(--nw-line);
      color: var(--nw-text);
      border-radius: 8px;
      padding: 10px 18px;
      font-family: var(--nw-font-display);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }

    .nw-button:hover,
    .nw-button:focus-visible {
      border-color: var(--nw-neon-cyan);
      box-shadow: 0 0 18px rgba(56, 232, 255, 0.35);
      outline: none;
    }

    .nw-hud {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
  `;

  document.head.appendChild(style);

  return {
    tokens: designTokens,
    dispose() {
      style.remove();
    }
  };
}
