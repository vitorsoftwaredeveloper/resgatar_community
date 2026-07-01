'use strict';

// Serverless plugin — initializes OTel before serverless-offline creates its HTTP server.
// Using a plugin hook avoids the NODE_OPTIONS subprocess inheritance problem.
class OtelPlugin {
  constructor() {
    this.hooks = {
      'before:offline:start': () => require('./tracing.local.js'),
    };
  }
}

module.exports = OtelPlugin;
