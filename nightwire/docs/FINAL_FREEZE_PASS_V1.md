# Final Freeze Pass v1

## Purpose

This pass freezes the NIGHTWIRE vertical slice and prepares a release tag.

It confirms QA, creates a release tag and prepares a bundle.

## Freeze checklist

- QA smoke checks pass.
- Eight-minute vertical slice test passes.
- No crash, stuck objective or broken interaction.
- Performance target met.
- Settings persist.
- Mission completes.
- Extraction works.

## Release tag

Run:

- chmod +x scripts/release.sh
- ./scripts/release.sh v1.0.0

## Bundle

Run:

- chmod +x scripts/bundle.sh
- ./scripts/bundle.sh 1.0.0

## Next step

Deploy the bundle and monitor feedback.
