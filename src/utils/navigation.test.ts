import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePath, isRouteActive, getRouteMetadata, ROUTES } from './navigation';

test('normalizePath maps root correctly', () => {
  assert.equal(normalizePath('/'), ROUTES.MANIFESTO);
  assert.equal(normalizePath(''), ROUTES.MANIFESTO);
});

test('normalizePath maps vision route correctly', () => {
  assert.equal(normalizePath('/vision-mission-valori'), ROUTES.VISION);
  assert.equal(normalizePath('/vision-mission-valori/'), ROUTES.VISION);
  assert.equal(normalizePath('/vision'), ROUTES.VISION);
});

test('normalizePath falls back to manifesto for unknown paths', () => {
  assert.equal(normalizePath('/unknown-path'), ROUTES.MANIFESTO);
});

test('isRouteActive works accurately', () => {
  assert.equal(isRouteActive('/', ROUTES.MANIFESTO), true);
  assert.equal(isRouteActive('/vision-mission-valori', ROUTES.VISION), true);
  assert.equal(isRouteActive('/vision-mission-valori', ROUTES.MANIFESTO), false);
  assert.equal(isRouteActive('/', ROUTES.VISION), false);
});

test('getRouteMetadata returns appropriate titles', () => {
  const manifestoMeta = getRouteMetadata(ROUTES.MANIFESTO);
  assert.ok(manifestoMeta.title.includes('Manifesto'));

  const visionMeta = getRouteMetadata(ROUTES.VISION);
  assert.ok(visionMeta.title.includes('Vision'));
});
