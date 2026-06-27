import * as helperService from "../../../../src/services/helper";
import * as annualChargesModule from "../../../../src/services/charges/getAnnualChargesSummary";
import { ExpenseModel } from "../../../../src/models/Expense";
import { DonationModel } from "../../../../src/models/Donation";
import { getAnnualBalanceService } from "../../../../src/services/balance/getAnnualBalance";

// Annual charges summary com 3 meses (jan, fev, mar) de entradas.
const chargesAnnual: any = {
  year: 2026,
  asOfMonth: 3,
  totals: { goal: 0, collected: 900, remaining: 0, percent: 0, byMethod: { pix: 0, cash: 0 }, counts: { paid: 0, pending: 0 } },
  byMonth: [
    { month: 1, collected: 300 },
    { month: 2, collected: 300 },
    { month: 3, collected: 300 },
  ],
  byMember: [],
};

describe("getAnnualBalanceService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let annualChargesSpy: jest.SpyInstance;
  let donationFindSpy: jest.SpyInstance;
  let findSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    annualChargesSpy = jest
      .spyOn(annualChargesModule, "getAnnualChargesSummaryService")
      .mockResolvedValue(chargesAnnual);

    // Doações entram no balanço como linha separada; sem mock a query real
    // tentaria abrir conexão e o teste pendura. Default vazio: cada teste que
    // exercita doações sobrescreve este spy.
    donationFindSpy = jest
      .spyOn(DonationModel, "find")
      .mockResolvedValue([] as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should require admin access", async () => {
    findSpy = jest.spyOn(ExpenseModel, "find").mockResolvedValue([] as any);

    await getAnnualBalanceService("admin-id", 2026);

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should cross entradas with saidas and accumulate the balance per month", async () => {
    // fev: 100 (event) ; mar: 50 (food) + 50 (food) = 100. jan sem despesa.
    findSpy = jest.spyOn(ExpenseModel, "find").mockResolvedValue([
      { referenceMonth: 1, amount: "100,00", category: "event" },
      { referenceMonth: 2, amount: "50,00", category: "food" },
      { referenceMonth: 2, amount: "50,00", category: "food" },
    ] as any);

    const balance = await getAnnualBalanceService("admin-id", 2026);

    expect(balance.byMonth).toEqual([
      { month: 1, entradas: 300, doacoes: 0, saidas: 0, resultado: 300, saldoAcumulado: 300 },
      { month: 2, entradas: 300, doacoes: 0, saidas: 100, resultado: 200, saldoAcumulado: 500 },
      { month: 3, entradas: 300, doacoes: 0, saidas: 100, resultado: 200, saldoAcumulado: 700 },
    ]);

    expect(balance.totals).toEqual({
      entradas: 900,
      doacoes: 0,
      saidas: 200,
      resultado: 700,
      saldoFinal: 700,
    });

    expect(balance.expensesByCategory).toEqual({ event: 100, food: 100 });
  });

  it("should allow a negative monthly resultado but keep the accumulated balance correct", async () => {
    findSpy = jest.spyOn(ExpenseModel, "find").mockResolvedValue([
      { referenceMonth: 1, amount: "500,00", category: "event" }, // fev: saída > entrada
    ] as any);

    const balance = await getAnnualBalanceService("admin-id", 2026);

    expect(balance.byMonth[1]).toEqual({
      month: 2,
      entradas: 300,
      doacoes: 0,
      saidas: 500,
      resultado: -200,
      saldoAcumulado: 100, // 300 (jan) + (-200) (fev)
    });
    expect(balance.totals.saldoFinal).toBe(400); // 100 + 300 (mar)
  });

  it("should only count approved donations, leaving returned (refunded/charged_back) out of the balance", async () => {
    findSpy = jest.spyOn(ExpenseModel, "find").mockResolvedValue([] as any);
    // Doações aprovadas: fev (referenceMonth 1) e mar (referenceMonth 2).
    donationFindSpy.mockResolvedValue([
      { referenceMonth: 1, amount: "40,00" },
      { referenceMonth: 2, amount: "10,00" },
    ] as any);

    const balance = await getAnnualBalanceService("admin-id", 2026);

    // A query do ledger de doações filtra status=approved na origem, então
    // refunded/charged_back nunca chegam à soma.
    expect(donationFindSpy).toHaveBeenCalledWith(
      expect.objectContaining({ referenceYear: 2026, status: "approved" }),
      expect.anything(),
      expect.anything(),
    );
    expect(balance.byMonth[1].doacoes).toBe(40);
    expect(balance.byMonth[2].doacoes).toBe(10);
    expect(balance.totals.doacoes).toBe(50);
  });

  it("should ignore expenses beyond the year-to-date cutoff (asOfMonth)", async () => {
    // Despesa em maio (referenceMonth 4) deve ser ignorada pois asOfMonth=3.
    findSpy = jest.spyOn(ExpenseModel, "find").mockResolvedValue([
      { referenceMonth: 4, amount: "999,00", category: "event" },
    ] as any);

    const balance = await getAnnualBalanceService("admin-id", 2026);

    expect(balance.totals.saidas).toBe(0);
    expect(balance.expensesByCategory).toEqual({});
  });
});
