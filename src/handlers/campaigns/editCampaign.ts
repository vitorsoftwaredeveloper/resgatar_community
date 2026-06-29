import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { parseRequestBody, validate } from "../../utils/validate";
import { createCampaignSchema } from "./validation/createCampaignSchema";
import { editCampaignService } from "../../services/campaigns/editCampaign";
import { STATUS_CODE } from "../../constants";

export const execute = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("IN - editCampaign");

  try {
    const memberCredentials = decodeToken(event.headers.authorization as string);
    const campaignId = event.pathParameters?.campaignId as string;

    if (!campaignId) {
      throw { statusCode: STATUS_CODE.BAD_REQUEST, message: "Campaign ID is required." };
    }

    const payload = parseRequestBody(event.body) as any;

    const errors = validate(createCampaignSchema, payload);
    if (errors.length > 0) {
      throw { statusCode: STATUS_CODE.BAD_REQUEST, message: "Validation Error", errors };
    }

    const campaign = await editCampaignService(
      memberCredentials.sub,
      campaignId,
      payload,
    );

    return sendSuccessResponse(
      "Campaign updated successfully!",
      STATUS_CODE.SUCCESS,
      campaign,
    );
  } catch (error) {
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - editCampaign");
  }
};
