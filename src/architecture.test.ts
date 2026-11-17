import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Enforces the dependency rules from docs/architecture/frontend-structure.md:
 *
 * 1. A feature never imports another feature. Shared state lives in
 *    `src/providers/`, shared UI in `src/components/`.
 * 2. Providers may use a feature's `api`, `validation` and `types` modules,
 *    but not its components or hooks.
 *
 * These are static checks on relative imports, so they fail the build the
 * moment a boundary is crossed rather than relying on review.
 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)));
const FEATURES = join(SRC, 'features');
const PROVIDERS = join(SRC, 'providers');
const PROVIDER_ALLOWED_FEATURE_FILES = new Set(['api', 'validation', 'types']);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

/** Returns each relative import target in a file, resolved to an absolute path without extension. */
function relativeImports(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  const pattern = /(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g;
  const targets: string[] = [];
  for (const match of source.matchAll(pattern)) {
    targets.push(resolve(dirname(file), match[1]));
  }
  return targets;
}

/** The feature directory name a path belongs to, or `null` when the path is outside `features/`. */
function featureOf(path: string): string | null {
  const rel = relative(FEATURES, path);
  if (rel.startsWith('..') || rel === '') return null;
  return rel.split(sep)[0];
}

describe('architecture boundaries', () => {
  const files = walk(SRC);

  it('no feature imports another feature', () => {
    const violations: string[] = [];
    for (const file of files) {
      const owner = featureOf(file);
      if (!owner) continue;
      for (const target of relativeImports(file)) {
        const targetFeature = featureOf(target);
        if (targetFeature && targetFeature !== owner) {
          violations.push(`${relative(SRC, file)} -> features/${targetFeature}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('providers only depend on feature api, validation and types modules', () => {
    const violations: string[] = [];
    for (const file of files.filter((f) => f.startsWith(PROVIDERS))) {
      for (const target of relativeImports(file)) {
        if (featureOf(target) === null) continue;
        const leaf = relative(FEATURES, target).split(sep).slice(1).join('/');
        if (!PROVIDER_ALLOWED_FEATURE_FILES.has(leaf)) {
          violations.push(`${relative(SRC, file)} -> features/${leaf}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
