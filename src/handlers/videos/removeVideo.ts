import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { removeVideoService } from "../../services/videos/removeVideo";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - removeVideo");

  try {
    const memberCredentials = decodeToken(event.headers.authorization as string);
    const videoId = event.pathParameters?.videoId as string;

    if (!videoId) {
      throw { statusCode: STATUS_CODE.BAD_REQUEST, message: "Video ID is required." };
    }

    await removeVideoService(memberCredentials.sub, videoId);

    return sendSuccessResponse("", STATUS_CODE.NO_CONTENT);
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - removeVideo");
  }
};
