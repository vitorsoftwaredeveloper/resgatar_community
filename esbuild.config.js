module.exports = {
  bundle: true,
  minify: true,
  platform: "node",
  target: "node24",
  concurrency: 10,
  inject: ["./src/observability/tracing.ts"],
  external: ["mongoose", "@opentelemetry/*"],
};
