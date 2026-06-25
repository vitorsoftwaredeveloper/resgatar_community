import * as helperService from "../../../../src/services/helper";
import { ExpenseModel } from "../../../../src/models/Expense";
import { listExpensesService } from "../../../../src/services/expenses/listExpenses";

const sampleExpenses = [
  {
    _id: "1",
    description: "Aluguel do salão",
    amount: "350,00",
    category: "event",
    referenceMonth: 5,
    referenceYear: 2026,
    date: 1750200000000,
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
];

describe("listExpensesService (integration)", () => {
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

  it("should verify the requester is an admin before listing", async () => {
    await listExpensesService("admin-id", 2026, 5);

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should not query the database when verifyAdmin rejects", async () => {
    verifyAdminSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    await expect(
      listExpensesService("not-admin", 2026, 5),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(findSpy).not.toHaveBeenCalled();
  });

  it("should query by referenceYear and referenceMonth", async () => {
    await listExpensesService("admin-id", 2026, 5);

    expect(findSpy).toHaveBeenCalledWith(
      { referenceYear: 2026, referenceMonth: 5 },
      expect.anything(),
      expect.objectContaining({ lean: true }),
    );
  });

  it("should map the raw documents to DTOs", async () => {
    const results = await listExpensesService("admin-id", 2026, 5);

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual(
      expect.objectContaining({
        _id: "1",
        description: "Aluguel do salão",
        amount: "350,00",
        category: "event",
        referenceMonth: 5,
        referenceYear: 2026,
        adminId: "admin-id",
      }),
    );
  });

  it("should return an empty array when no expenses match", async () => {
    findSpy.mockResolvedValue([] as any);

    const results = await listExpensesService("admin-id", 2026, 5);

    expect(results).toEqual([]);
  });

  it("should omit note from DTO when not set", async () => {
    const results = await listExpensesService("admin-id", 2026, 5);

    expect(results[0].note).toBeUndefined();
  });

  it("should include note in DTO when set", async () => {
    findSpy.mockResolvedValue([
      { ...sampleExpenses[0], note: "Cobrado via PIX" },
    ] as any);

    const results = await listExpensesService("admin-id", 2026, 5);

    expect(results[0].note).toBe("Cobrado via PIX");
  });
});
