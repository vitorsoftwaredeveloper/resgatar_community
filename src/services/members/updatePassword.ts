import { STATUS_CODE } from "../../constants";
import { MEMBER_ROLES } from "../../constants/members";
import { changeCognitoPassword } from "../../utils/cognito";
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
    memberAuthorized.role !== MEMBER_ROLES.ADMIN &&
    memberWillBeUpdated._id !== memberAuthorized._id
  ) {
    throw {
      statusCode: STATUS_CODE.FORBIDDEN,
      message: "You are not authorized to update this password",
    };
  }

  try {
    await changeCognitoPassword(memberId, password);
  } catch (err) {
    throw err;
  } finally {
    console.log("OUT - updatePasswordService");
  }
};
