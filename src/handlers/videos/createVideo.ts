import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { parseRequestBody, validate } from "../../utils/validate";
import { createVideoSchema } from "./validation/createVideoSchema";
import { createVideoService } from "../../services/videos/createVideo";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - createVideo");

  try {
    const memberCredentials = decodeToken(event.headers.authorization as string);
    const payload = parseRequestBody(event.body) as any;

    const errors = validate(createVideoSchema, payload);
    if (errors.length > 0) {
      throw { statusCode: STATUS_CODE.BAD_REQUEST, message: "Validation Error", errors };
    }

    const video = await createVideoService(memberCredentials.sub, payload.url, payload.title);

    return sendSuccessResponse("Video created successfully!", STATUS_CODE.CREATED, video);
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - createVideo");
  }
};
