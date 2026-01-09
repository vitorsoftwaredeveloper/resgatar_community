import { changeCognitoPassword } from "../../utils/cognito";
import { findMemberById } from "../helper";

export const updatePasswordService = async (
  memberId: string,
  password: string
) => {
  console.log("IN - updatePasswordService");
  console.log("Member id:", memberId);
  await findMemberById(memberId);

  try {
    await changeCognitoPassword(memberId, password);
  } catch (err) {
    throw err;
  } finally {
    console.log("OUT - updatePasswordService");
  }
};
