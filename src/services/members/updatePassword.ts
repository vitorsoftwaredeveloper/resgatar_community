import { STATUS_CODE } from "../../constants";
import { MEMBER_ROLES } from "../../constants/members";
import { changeCognitoPassword } from "../../utils/cognito";
import { sendErrorResponse } from "../../utils/http";
import { findMemberById } from "../helper";

export const updatePasswordService = async (
  tokenMemberId: string,
  password: string,
  memberId: string,
) => {
  console.log("IN - updatePasswordService");

  const memberAuthorized = await findMemberById(tokenMemberId);
  const memberWillBeUpdated = await findMemberById(memberId);

  if (
    memberAuthorized.role === MEMBER_ROLES.USER &&
    memberWillBeUpdated._id !== memberAuthorized._id
  ) {
    return sendErrorResponse({
      statusCode: STATUS_CODE.FORBIDDEN,
      message: "You are not authorized to update this password",
    });
  }

  try {
    await changeCognitoPassword(memberId, password);
  } catch (err) {
    throw err;
  } finally {
    console.log("OUT - updatePasswordService");
  }
};
