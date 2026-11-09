/**
 * Machala Deployment & Live Check Pass v1
 * Live URL health check.
 */

const url = process.argv[2];

if (!url) {
  console.error('Usage: node scripts/liveCheck.js https://your-domain');
  process.exit(1);
}

async function check() {
  try {
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      console.error('Live check failed:', response.status);
      process.exit(1);
    }

    const text = await response.text();

    if (!text.includes('<html')) {
      console.error('Live check failed: unexpected response');
      process.exit(1);
    }

    console.log('Live check passed:', url);
  } catch (error) {
    console.error('Live check failed:', error.message);
    process.exit(1);
  }
}

check();
