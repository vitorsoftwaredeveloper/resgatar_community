import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { AwsLambdaInstrumentation } from "@opentelemetry/instrumentation-aws-lambda";
import { MongooseInstrumentation } from "@opentelemetry/instrumentation-mongoose";

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (endpoint && !(global as any).__OTEL_INITIALIZED__) {
  (global as any).__OTEL_INITIALIZED__ = true;
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      "service.name": "resgatar-community",
      "deployment.environment": process.env.STAGE ?? "local",
    }),
    spanProcessors: [
      new SimpleSpanProcessor(
        new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
      ),
    ],
    instrumentations: [
      new HttpInstrumentation(),
      new AwsLambdaInstrumentation(),
      new MongooseInstrumentation(),
    ],
  });

  sdk.start();
}
