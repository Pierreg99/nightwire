# Final Polish & Release Bundle Pass v1

## Purpose

This pass prepares NIGHTWIRE for a playable vertical slice release.

It adds release metadata, a bundle script and a polish checklist.

## Modules

- releaseInfo.js: release name, version, channel, build date and campaign
- bundle.sh: builds the production bundle and creates a ZIP artifact

## Bundle

Run:

- chmod +x scripts/bundle.sh
- ./scripts/bundle.sh 1.0.0

This creates:

- dist production build
- nightwire-vertical-slice-1.0.0.zip

## Polish checklist

- Boot flow works.
- Movement feels responsive.
- Shooting has recoil, camera kick and audio.
- Vehicle enter and exit works.
- Phone opens and shows Jobs, Map, Radio and Messages.
- Cold Cargo progresses through all beats.
- Heat increases and decays.
- Extraction works for Apartment 4B or Dock Boat.
- Settings persist.
- Quality tiers adapt.
- No console errors during normal play.

## Release

Create a release tag:

- ./scripts/release.sh v1.0.0

Create a bundle:

- ./scripts/bundle.sh 1.0.0

## Next step

Deploy the bundle to a static host or container platform and monitor feedback.
