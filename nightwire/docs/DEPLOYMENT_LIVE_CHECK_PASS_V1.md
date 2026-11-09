# Deployment & Live Check Pass v1

## Purpose

This pass deploys NIGHTWIRE to a VPS and verifies the live URL.

It adds a deployment script, live health check and deployment checklist.

## Modules

- scripts/deploy.sh: builds and deploys the production bundle to a VPS
- scripts/liveCheck.js: verifies the live URL returns a valid HTML response

## Deployment

Set environment variables:

- DEPLOY_HOST
- DEPLOY_USER
- DEPLOY_DIR

Run:

- chmod +x scripts/deploy.sh
- DEPLOY_HOST=your-server ./scripts/deploy.sh

## Live check

Run:

- node scripts/liveCheck.js https://your-domain

This verifies the live URL returns a valid HTML response.

## Deployment checklist

- Build production bundle.
- Deploy to VPS.
- Run live check.
- Verify no console errors.
- Verify performance target.
- Monitor feedback.

## Next step

Monitor frame time, errors and user feedback after deployment.
