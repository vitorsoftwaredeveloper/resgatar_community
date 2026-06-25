import { parseYearMonth } from "../../../../src/handlers/expenses/helper";

describe("parseYearMonth", () => {
  it("retorna year e month quando ambos são válidos", () => {
    expect(parseYearMonth({ year: "2026", month: "5" })).toEqual({
      year: 2026,
      month: 5,
    });
  });

  it("aceita month=0 (janeiro)", () => {
    expect(parseYearMonth({ year: "2026", month: "0" })).toEqual({
      year: 2026,
      month: 0,
    });
  });

  it("aceita month=11 (dezembro)", () => {
    expect(parseYearMonth({ year: "2026", month: "11" })).toEqual({
      year: 2026,
      month: 11,
    });
  });

  it("aceita year=2000 (limite inferior)", () => {
    const result = parseYearMonth({ year: "2000", month: "0" });
    expect(result.year).toBe(2000);
  });

  it("aceita year=2100 (limite superior)", () => {
    const result = parseYearMonth({ year: "2100", month: "0" });
    expect(result.year).toBe(2100);
  });

  it("lança 400 quando year está ausente", () => {
    let err: any;
    try {
      parseYearMonth({ month: "5" });
    } catch (e) {
      err = e;
    }
    expect(err?.statusCode).toBe(400);
  });

  it("lança 400 quando year < 2000", () => {
    let err: any;
    try {
      parseYearMonth({ year: "1999", month: "5" });
    } catch (e) {
      err = e;
    }
    expect(err?.statusCode).toBe(400);
  });

  it("lança 400 quando year > 2100", () => {
    let err: any;
    try {
      parseYearMonth({ year: "2101", month: "5" });
    } catch (e) {
      err = e;
    }
    expect(err?.statusCode).toBe(400);
  });

  it("lança 400 quando year não é número", () => {
    let err: any;
    try {
      parseYearMonth({ year: "abc", month: "5" });
    } catch (e) {
      err = e;
    }
    expect(err?.statusCode).toBe(400);
  });

  it("lança 400 quando month < 0", () => {
    let err: any;
    try {
      parseYearMonth({ year: "2026", month: "-1" });
    } catch (e) {
      err = e;
    }
    expect(err?.statusCode).toBe(400);
  });

  it("lança 400 quando month > 11", () => {
    let err: any;
    try {
      parseYearMonth({ year: "2026", month: "12" });
    } catch (e) {
      err = e;
    }
    expect(err?.statusCode).toBe(400);
  });

  it("lança 400 quando month não é número", () => {
    let err: any;
    try {
      parseYearMonth({ year: "2026", month: "jan" });
    } catch (e) {
      err = e;
    }
    expect(err?.statusCode).toBe(400);
  });

  it("lança 400 quando queryStringParameters é null", () => {
    let err: any;
    try {
      parseYearMonth(null);
    } catch (e) {
      err = e;
    }
    expect(err?.statusCode).toBe(400);
  });
});
