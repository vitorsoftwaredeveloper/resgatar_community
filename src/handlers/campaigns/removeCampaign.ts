import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { removeCampaignService } from "../../services/campaigns/removeCampaign";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - removeCampaign");

  try {
    const memberCredentials = decodeToken(event.headers.authorization as string);
    const campaignId = event.pathParameters?.campaignId as string;

    if (!campaignId) {
      throw { statusCode: STATUS_CODE.BAD_REQUEST, message: "Campaign ID is required." };
    }

    await removeCampaignService(memberCredentials.sub, campaignId);

    return sendSuccessResponse("", STATUS_CODE.NO_CONTENT);
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - removeCampaign");
  }
};
