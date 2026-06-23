import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { listAllVideosService } from "../../services/videos/listAllVideos";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  _event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - listAllVideos");

  try {
    const videos = await listAllVideosService();

    return sendSuccessResponse(
      "Videos retrieved successfully.",
      STATUS_CODE.SUCCESS,
      videos,
    );
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - listAllVideos");
  }
};
