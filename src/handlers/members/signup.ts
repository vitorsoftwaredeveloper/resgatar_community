import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { validate } from "../../utils/validate";
import { SignUpValidatorSchema } from "./validation/signup";
import { SignUpPayload } from "../../types/members";
import { signUpService } from "../../services/members/signup";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const payload = parseRequestBody(event.body) as any;

    const errors = validate(SignUpValidatorSchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: 400,
        message: "Validation Error",
        errors,
      });
    }

    const newMember = await signUpService(payload);

    return sendSuccessResponse(newMember);
  } catch (error) {
    return sendErrorResponse(error);
  }
};

const parseRequestBody = (body: string | null): SignUpPayload | null => {
  console.log("IN - parseRequestBody");

  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - parseRequestBody");
  }
};

const sendErrorResponse = (error: any): APIGatewayProxyResult => ({
  statusCode: error.statusCode || 500,
  body: JSON.stringify({
    message: error.message || "Internal Server Error",
    errors: error.errors || null,
  }),
});

const sendSuccessResponse = (data: any): APIGatewayProxyResult => ({
  statusCode: 201,
  body: JSON.stringify({
    message: "Member created successfully!",
    data,
  }),
});
