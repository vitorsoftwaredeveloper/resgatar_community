import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { STATUS_CODE } from "../../constants";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/http";
import { decodeToken } from "../../utils/helper";
import { parseRequestBody, validate } from "../../utils/validate";
import { createNewContributionByYearSchema } from "./validation/createNewContributionByYearSchema";
import { createNewContributionByYearService } from "../../services/contributions/createNewContributionByYear";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("IN - createNewContributionByYear");

    const memberCredentials = decodeToken(
      event.headers.authorization as string
    );

    const body = parseRequestBody(event.body) as any;

    const errors = validate(createNewContributionByYearSchema, body);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: 400,
        message: "Validation Error",
        errors,
      });
    }

    await createNewContributionByYearService(memberCredentials.sub, body.year);

    return sendSuccessResponse("", STATUS_CODE.NO_CONTENT);
  } catch (error) {
    console.log({ error });
    return sendErrorResponse(error);
  } finally {
    console.log("OUT - createNewContributionByYear");
  }
};
