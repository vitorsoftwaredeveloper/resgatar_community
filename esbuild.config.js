module.exports = {
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: "node",
  target: "node24",
  // Mantém dependências da AWS fora do bundle
  external: ["aws-sdk"],
  // Inclui arquivos JSON automaticamente no bundle
  loader: {
    ".json": "json",
  },
  sourcesContent: false,
  // Para builds mais rápidos
  keepNames: true,
};
