interface IAnnualBalanceMonth {
  month: number; // 1-indexado (1 = janeiro), alinhado ao annual summary de charges
  entradas: number; // contribuições efetivamente arrecadadas no mês (collected)
  doacoes: number; // doações avulsas aprovadas no mês (PIX + dinheiro)
  saidas: number; // total de despesas do mês
  resultado: number; // entradas + doacoes - saidas (pode ser negativo)
  saldoAcumulado: number; // soma corrente dos resultados, jan -> mês, dentro do ano
}

interface IAnnualBalance {
  year: number;
  asOfMonth: number; // corte year-to-date (mês atual no ano corrente, 12 em anos passados)
  totals: {
    entradas: number;
    doacoes: number;
    saidas: number;
    resultado: number; // entradas + doacoes - saidas do ano (YTD)
    saldoFinal: number; // saldo acumulado ao fim do período
  };
  byMonth: IAnnualBalanceMonth[];
  expensesByCategory: Record<string, number>; // despesas YTD agrupadas por categoria
}

export { IAnnualBalance, IAnnualBalanceMonth };
