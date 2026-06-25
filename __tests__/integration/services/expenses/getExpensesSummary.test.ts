import * as helperService from "../../../../src/services/helper";
import { ExpenseModel } from "../../../../src/models/Expense";
import { getExpensesSummaryService } from "../../../../src/services/expenses/getExpensesSummary";

const sampleExpenses = [
  {
    _id: "1",
    description: "Aluguel",
    amount: "350,00",
    category: "event",
    referenceMonth: 5,
    referenceYear: 2026,
    date: 1750000000000,
    adminId: "admin-id",
  },
  {
    _id: "2",
    description: "Lanche",
    amount: "120,50",
    category: "food",
    referenceMonth: 5,
    referenceYear: 2026,
    date: 1750100000000,
    adminId: "admin-id",
  },
  {
    _id: "3",
    description: "Bebidas",
    amount: "79,50",
    category: "food",
    referenceMonth: 5,
    referenceYear: 2026,
    date: 1750200000000,
    adminId: "admin-id",
  },
];

describe("getExpensesSummaryService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let findSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    findSpy = jest
      .spyOn(ExpenseModel, "find")
      .mockResolvedValue(sampleExpenses as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should require admin access", async () => {
    await getExpensesSummaryService("admin-id", 2026, 5);

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should sum the total and group by category", async () => {
    const summary = await getExpensesSummaryService("admin-id", 2026, 5);

    expect(summary.total).toBe(550);
    expect(summary.count).toBe(3);
    expect(summary.byCategory).toEqual({ event: 350, food: 200 });
    expect(summary.year).toBe(2026);
    expect(summary.month).toBe(5);
    expect(summary.expenses).toHaveLength(3);
  });

  it("should return zeros when there are no expenses", async () => {
    findSpy.mockResolvedValue([] as any);

    const summary = await getExpensesSummaryService("admin-id", 2026, 5);

    expect(summary.total).toBe(0);
    expect(summary.count).toBe(0);
    expect(summary.byCategory).toEqual({});
    expect(summary.expenses).toEqual([]);
  });
});
