import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMatrix } from '../src/matrix.js';

test('filters matrix by minimum PHP and WordPress versions', () => {
  const result = validateMatrix(
    { requiresPhp: '8.2', requiresWp: '6.5' },
    { phpVersions: ['8.1', '8.2', '8.3'], wordpressVersions: ['6.4', '6.5', '6.6'] }
  );
  assert.deepEqual(result.php, ['8.2', '8.3']);
  assert.deepEqual(result.wordpress, ['6.5', '6.6']);
  assert.deepEqual(result.errors, []);
});

test('default matrix includes the current WordPress boundary', () => {
  const result = validateMatrix({ requiresPhp: '8.1', requiresWp: '6.8' });
  assert.deepEqual(result.wordpress, ['6.8', '6.9', '7.0']);
  assert.deepEqual(result.errors, []);
});

test('default matrix supports plugins requiring PHP 8.5', () => {
  const result = validateMatrix({ requiresPhp: '8.5', requiresWp: '7.0' });
  assert.deepEqual(result.php, ['8.5']);
  assert.deepEqual(result.errors, []);
});

test('reports impossible minimum versions', () => {
  const result = validateMatrix(
    { requiresPhp: '9.0', requiresWp: '7.0' },
    { phpVersions: ['8.3'], wordpressVersions: ['6.7'] }
  );
  assert.equal(result.errors.length, 2);
});
