module.exports = {
  bundle: true,
  minify: true,
  sourcemap: false, // remove mapas em prod
  platform: "node",
  target: "node24", // Mantém dependências da AWS fora do bundle
  external: ["aws-sdk"], // Mantém dependências da AWS fora do bundle
  loader: {
    ".json": "json", // Inclui arquivos JSON automaticamente no bundle
  },
  sourcesContent: false, // Para builds mais rápidos
  keepNames: false, // permite minificação completa
};
