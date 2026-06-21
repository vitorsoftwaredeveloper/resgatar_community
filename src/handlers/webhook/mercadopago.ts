import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { STATUS_CODE } from "../../constants";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { validateWebhookSignature } from "../../integrations/mercadopago";
import { processMercadoPagoWebhook } from "../../services/webhook/mercadopago";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - mercadoPagoWebhook");

    const xSignature = event.headers["x-signature"] ?? "";
    const xRequestId = event.headers["x-request-id"] ?? "";
    const body = JSON.parse(event.body ?? "{}");

    console.log({ payload: body });

    if (
      !validateWebhookSignature(xSignature, xRequestId, body?.data?.id ?? "")
    ) {
      console.warn("Invalid webhook signature from Mercado Pago");
      return sendErrorResponse({
        message: "Invalid signature",
        statusCode: STATUS_CODE.UNAUTHORIZED,
      });
    }

    await processMercadoPagoWebhook(body);

    return sendSuccessResponse(
      "Webhook processed successfully",
      STATUS_CODE.SUCCESS,
    );
  } catch (error) {
    console.error("ERR - mercadoPagoWebhook:", error);
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - mercadoPagoWebhook");
  }
};
