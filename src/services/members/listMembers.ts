import { MemberModel } from "../../models/Member";
import { IMember } from "../../types/members";
import { verifyAdmin } from "../helper";
import { decrypt } from "../../utils/crypto";

export const listMembersService = async (
  memberId: string
): Promise<Array<IMember>> => {
  console.log("IN - listMembersService");

  await verifyAdmin(memberId);

  const members = await MemberModel.find({});

  console.log("OUT - listMembersService");

  return members.map((m) => ({
    ...m,
    identification: {
      type: m.identification.type,
      numberType: decrypt(m.identification.numberType),
    },
  })) as Array<IMember>;
};
