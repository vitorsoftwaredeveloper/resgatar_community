'use strict';

// Loaded via NODE_OPTIONS --require before serverless-offline starts.
// Must be plain CommonJS so no ts-node is needed.
const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
if (!endpoint || global.__OTEL_INITIALIZED__) return;

global.__OTEL_INITIALIZED__ = true;

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { AwsLambdaInstrumentation } = require('@opentelemetry/instrumentation-aws-lambda');
const { MongooseInstrumentation } = require('@opentelemetry/instrumentation-mongoose');

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    'service.name': 'resgatar-community',
    'deployment.environment': process.env.STAGE ?? 'local',
  }),
  spanProcessors: [
    new SimpleSpanProcessor(new OTLPTraceExporter({ url: `${endpoint}/v1/traces` })),
  ],
  instrumentations: [
    new HttpInstrumentation({
      ignoreOutgoingRequestHook: (req) => req.hostname === 'localhost' && req.port === 4318,
    }),
    new AwsLambdaInstrumentation(),
    new MongooseInstrumentation(),
  ],
});

sdk.start();
