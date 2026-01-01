# EAS Build npm Dependency Fix

## Problem
EAS Build uses `npm ci` which doesn't respect `.npmrc` `legacy-peer-deps` setting, causing dependency conflicts.

## Solution Applied

1. **Updated `@types/react` to `^19.1.0`** - Matches React Native 0.81.5 requirement
2. **Created `.npmrc` with `legacy-peer-deps=true`** - For local development
3. **Regenerated `package-lock.json`** - With correct versions using `npm install --legacy-peer-deps`

## Why This Works

- `package-lock.json` now has correct versions locked
- `.npmrc` helps with local development
- EAS Build will use the locked versions from `package-lock.json`

## If Build Still Fails

If EAS Build still fails with `npm ci`, the issue is that `npm ci` is strict and doesn't allow peer dependency conflicts. In that case, we may need to:

1. Ensure all dependencies are actually compatible
2. Or use a custom build hook to override npm install behavior

## Current Status

✅ `@types/react@^19.1.0` in package.json
✅ `package-lock.json` regenerated with correct versions
✅ `.npmrc` configured for local development

