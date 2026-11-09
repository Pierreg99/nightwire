/**
 * Machala Final Polish & Release Bundle Pass v1
 * Release info and version metadata.
 */

export const RELEASE_INFO = {
  name: 'NIGHTWIRE',
  version: '1.0.0',
  channel: 'vertical-slice',
  buildDate: new Date().toISOString(),
  platform: 'web',
  engine: 'three.js',
  campaign: 'Cold Cargo'
};

export function getReleaseInfo() {
  return { ...RELEASE_INFO };
}
