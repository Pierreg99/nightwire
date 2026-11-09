# Deployment & Live Check Pass v1

## Purpose

This pass deploys the NIGHTWIRE vertical slice and verifies the live URL.

It runs the release, bundle, deployment and live check steps.

## Deployment steps

- chmod +x scripts/release.sh
- ./scripts/release.sh v1.0.0
- chmod +x scripts/bundle.sh
- ./scripts/bundle.sh 1.0.0
- chmod +x scripts/deploy.sh
- ./scripts/deploy.sh

## Live check

- Verify the live URL returns HTTP 200.
- Verify the game loads without console errors.
- Verify the mission starts.
- Verify the extraction completes.
- Verify settings persist.

## Next step

Monitor feedback and fix the five worst breaks before the next release.
