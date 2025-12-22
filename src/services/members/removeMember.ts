import { removeMemberCognito } from "../../utils/cognito";
import { MemberModel } from "../../models/Member";
import { verifyAdmin } from "../helper";
import { ContributionModel } from "../../models/Contribution";

export const removeMemberService = async (
  adminId: string,
  idMember: string
): Promise<void> => {
  console.log("IN - removeMemberService");

  await verifyAdmin(adminId);

  try {
    await removeMemberCognito(idMember);

    await MemberModel.deleteOne({ _id: idMember });
    await ContributionModel.deleteMany({ memberId: idMember });
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - removeMemberService");
  }
};
