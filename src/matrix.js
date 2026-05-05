import { compareVersions, parseVersion, uniqueSortedVersions } from './version.js';

export const DEFAULT_WORDPRESS_VERSIONS = ['6.4', '6.5', '6.6', '6.7'];
export const DEFAULT_PHP_VERSIONS = ['8.1', '8.2', '8.3'];

export function validateMatrix(metadata, options = {}) {
  const wordpress = uniqueSortedVersions(options.wordpressVersions ?? DEFAULT_WORDPRESS_VERSIONS);
  const php = uniqueSortedVersions(options.phpVersions ?? DEFAULT_PHP_VERSIONS);
  const warnings = [];
  const errors = [];

  if (!metadata.requiresPhp) {
    warnings.push('Missing Requires PHP header; defaulting CI matrix to supported PHP versions.');
  } else if (!parseVersion(metadata.requiresPhp)) {
    errors.push(`Requires PHP is not a simple version: ${metadata.requiresPhp}`);
  }

  if (!metadata.requiresWp) {
    warnings.push('Missing Requires at least header; defaulting CI matrix to supported WordPress versions.');
  } else if (!parseVersion(metadata.requiresWp)) {
    errors.push(`Requires at least is not a simple version: ${metadata.requiresWp}`);
  }

  const filteredPhp = metadata.requiresPhp
    ? php.filter((version) => compareVersions(version, metadata.requiresPhp) >= 0)
    : php;
  const filteredWordpress = metadata.requiresWp
    ? wordpress.filter((version) => compareVersions(version, metadata.requiresWp) >= 0)
    : wordpress;

  if (filteredPhp.length === 0) {
    errors.push(`No PHP matrix entries satisfy Requires PHP ${metadata.requiresPhp}.`);
  }
  if (filteredWordpress.length === 0) {
    errors.push(`No WordPress matrix entries satisfy Requires at least ${metadata.requiresWp}.`);
  }

  return {
    php: filteredPhp,
    wordpress: filteredWordpress,
    warnings,
    errors
  };
}
