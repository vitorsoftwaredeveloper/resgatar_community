import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { listAllVideosService } from "../../services/videos/listAllVideos";
import { STATUS_CODE } from "../../constants";
import { parsePagination, parseVideoFilters } from "./helper";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - listAllVideos");
  console.log("Query params:", JSON.stringify(event.queryStringParameters));

  try {
    const { page, limit } = parsePagination(event.queryStringParameters);
    const filters = parseVideoFilters(event.queryStringParameters);
    console.log("Pagination:", JSON.stringify({ page, limit }));
    console.log("Filters:", JSON.stringify(filters));

    const videos = await listAllVideosService(page, limit, filters);
    console.log(
      "Result:",
      JSON.stringify({
        returned: videos.items.length,
        page: videos.page,
        limit: videos.limit,
        total: videos.total,
        totalPages: videos.totalPages,
      }),
    );

    return sendSuccessResponse(
      "Videos retrieved successfully.",
      STATUS_CODE.SUCCESS,
      videos,
    );
  } catch (error) {
    console.log("Errors:", JSON.stringify(error));
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - listAllVideos");
  }
};
