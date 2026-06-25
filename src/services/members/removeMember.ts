import { removeMemberCognito } from "../../utils/cognito";
import { MemberModel } from "../../models/Member";
import { verifyAdmin } from "../helper";
import { ContributionModel } from "../../models/Contribution";
import { ChargeModel } from "../../models/Charge";
import { VideoModel } from "../../models/Video";

export const removeMemberService = async (
  requesterId: string,
  idMember: string
): Promise<void> => {
  console.log("IN - removeMemberService");

  if (requesterId !== idMember) {
    await verifyAdmin(requesterId);
  }

  try {
    await removeMemberCognito(idMember);

    await Promise.all([
      MemberModel.deleteOne({ _id: idMember }),
      ContributionModel.deleteMany({ memberId: idMember }),
      ChargeModel.deleteMany({ memberId: idMember }),
      VideoModel.deleteMany({ memberId: idMember }),
    ]);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - removeMemberService");
  }
};
