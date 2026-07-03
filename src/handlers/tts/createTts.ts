import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse } from "../../utils/http";
import { parseRequestBody, validate } from "../../utils/validate";
import { createTtsSchema } from "./validation/createTtsSchema";
import { createTtsService } from "../../services/tts/createTts";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - createTts");

  try {
    const payload = parseRequestBody(event.body) as any;

    const errors = validate(createTtsSchema, payload);
    if (errors.length > 0) {
      throw { statusCode: STATUS_CODE.BAD_REQUEST, message: "Validation Error", errors };
    }

    const result = await createTtsService(payload.text);

    // Contrato do front (GoogleTTSService.ts) espera { audioContent } no
    // corpo cru, sem o envelope { message, data } usado nas demais rotas.
    return { statusCode: STATUS_CODE.SUCCESS, body: JSON.stringify(result) };
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - createTts");
  }
};
