import axios from "axios";
import { createMercadoPagoClient } from "../../../src/integrations/mercadopago";
import { ICreateChargeMPagoRequest } from "../../../src/types/charges";

const MPAGO_URL = "https://api.mercadopago.com/v1/payments";
const MPAGO_TOKEN = "TEST-token-123";

const chargeRequest: ICreateChargeMPagoRequest = {
  transaction_amount: 50.0,
  payment_method_id: "pix",
  description: "Contribution to Resgatar Community",
  payer: {
    identification: { number: "12345678900", type: "CPF" },
    last_name: "Silva",
    first_name: "João",
    email: "joao@email.com",
  },
};

const mockPaymentResponse = {
  id: 123456,
  status: "pending",
  status_detail: "pending_waiting_transfer",
  payment_method_id: "pix",
  point_of_interaction: {
    transaction_data: {
      qr_code: "qr-string",
      qr_code_base64: "qr-base64",
      ticket_url: "https://mpago.la/ticket",
    },
  },
};

beforeEach(() => {
  process.env.MPAGO_TRANSACTION_URL = MPAGO_URL;
  process.env.MPAGO_ACCESS_TOKEN = MPAGO_TOKEN;
});

afterEach(() => {
  delete process.env.MPAGO_TRANSACTION_URL;
  delete process.env.MPAGO_ACCESS_TOKEN;
  jest.restoreAllMocks();
});

describe("createMercadoPagoClient", () => {
  it("should return an object with createPayment and consultPayment methods", async () => {
    const client = await createMercadoPagoClient();

    expect(typeof client.createPayment).toBe("function");
    expect(typeof client.consultPayment).toBe("function");
  });

  describe("createPayment", () => {
    it("should POST to MPAGO_TRANSACTION_URL with charge data", async () => {
      const postSpy = jest
        .spyOn(axios, "post")
        .mockResolvedValue({ data: mockPaymentResponse });

      const client = await createMercadoPagoClient();
      await client.createPayment(chargeRequest);

      expect(postSpy).toHaveBeenCalledWith(
        MPAGO_URL,
        chargeRequest,
        expect.any(Object)
      );
    });

    it("should include Authorization header with Bearer token", async () => {
      const postSpy = jest
        .spyOn(axios, "post")
        .mockResolvedValue({ data: mockPaymentResponse });

      const client = await createMercadoPagoClient();
      await client.createPayment(chargeRequest);

      const headers = postSpy.mock.calls[0][2]?.headers as any;
      expect(headers.Authorization).toBe(`Bearer ${MPAGO_TOKEN}`);
    });

    it("should include Content-Type application/json header", async () => {
      const postSpy = jest
        .spyOn(axios, "post")
        .mockResolvedValue({ data: mockPaymentResponse });

      const client = await createMercadoPagoClient();
      await client.createPayment(chargeRequest);

      const headers = postSpy.mock.calls[0][2]?.headers as any;
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("should include X-Idempotency-Key header", async () => {
      const postSpy = jest
        .spyOn(axios, "post")
        .mockResolvedValue({ data: mockPaymentResponse });

      const client = await createMercadoPagoClient();
      await client.createPayment(chargeRequest);

      const headers = postSpy.mock.calls[0][2]?.headers as any;
      expect(headers["X-Idempotency-Key"]).toBeDefined();
      expect(typeof headers["X-Idempotency-Key"]).toBe("string");
    });

    it("should generate a different idempotency key on each call", async () => {
      const postSpy = jest
        .spyOn(axios, "post")
        .mockResolvedValue({ data: mockPaymentResponse });

      const client = await createMercadoPagoClient();
      await client.createPayment(chargeRequest);
      await client.createPayment(chargeRequest);

      const key1 = (postSpy.mock.calls[0][2]?.headers as any)["X-Idempotency-Key"];
      const key2 = (postSpy.mock.calls[1][2]?.headers as any)["X-Idempotency-Key"];
      expect(key1).not.toBe(key2);
    });

    it("should return response.data from MercadoPago", async () => {
      jest.spyOn(axios, "post").mockResolvedValue({ data: mockPaymentResponse });

      const client = await createMercadoPagoClient();
      const result = await client.createPayment(chargeRequest);

      expect(result).toEqual(mockPaymentResponse);
    });

    it("should throw when axios POST fails", async () => {
      jest
        .spyOn(axios, "post")
        .mockRejectedValue({ response: { status: 422 }, message: "Unprocessable Entity" });

      const client = await createMercadoPagoClient();

      await expect(client.createPayment(chargeRequest)).rejects.toMatchObject({
        response: { status: 422 },
      });
    });
  });

  describe("consultPayment", () => {
    it("should GET to MPAGO_TRANSACTION_URL/{transactionId}", async () => {
      const getSpy = jest
        .spyOn(axios, "get")
        .mockResolvedValue({ data: { id: 123456, status: "approved" } });

      const client = await createMercadoPagoClient();
      await client.consultPayment("123456");

      expect(getSpy).toHaveBeenCalledWith(
        `${MPAGO_URL}/123456`,
        expect.any(Object)
      );
    });

    it("should include Authorization header with Bearer token", async () => {
      const getSpy = jest
        .spyOn(axios, "get")
        .mockResolvedValue({ data: { status: "approved" } });

      const client = await createMercadoPagoClient();
      await client.consultPayment("123456");

      const headers = getSpy.mock.calls[0][1]?.headers as any;
      expect(headers.Authorization).toBe(`Bearer ${MPAGO_TOKEN}`);
    });

    it("should include X-Idempotency-Key header", async () => {
      const getSpy = jest
        .spyOn(axios, "get")
        .mockResolvedValue({ data: { status: "approved" } });

      const client = await createMercadoPagoClient();
      await client.consultPayment("123456");

      const headers = getSpy.mock.calls[0][1]?.headers as any;
      expect(headers["X-Idempotency-Key"]).toBeDefined();
    });

    it("should return response.data from MercadoPago", async () => {
      const mockResponse = { id: 123456, status: "approved" };
      jest.spyOn(axios, "get").mockResolvedValue({ data: mockResponse });

      const client = await createMercadoPagoClient();
      const result = await client.consultPayment("123456");

      expect(result).toEqual(mockResponse);
    });

    it("should throw when axios GET fails", async () => {
      jest
        .spyOn(axios, "get")
        .mockRejectedValue({ response: { status: 404 }, message: "Not Found" });

      const client = await createMercadoPagoClient();

      await expect(client.consultPayment("999")).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });
});
