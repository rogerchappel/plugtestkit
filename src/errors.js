export class PlugtestkitError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'PlugtestkitError';
    this.code = options.code ?? 'PLUGTESTKIT_ERROR';
    this.details = options.details ?? {};
  }
}
