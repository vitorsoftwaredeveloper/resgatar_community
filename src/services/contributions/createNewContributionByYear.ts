import { IMember } from "../../types/members";
import { createContributionByYear, verifyAdmin } from "../helper";
import { MemberModel } from "../../models/Member";

export const createNewContributionByYearService = async (
  memberId: string,
  year: number,
): Promise<any> => {
  console.log("IN - createNewContributionByYearService");

  await verifyAdmin(memberId);

  try {
    const members = await findAllMembers();

    const result = await Promise.allSettled(
      members.map(({ _id }) => createContributionByYear(_id, year, 0)),
    );

    if (result.some((res) => res.status === "rejected")) {
      result.forEach((res) => {
        if (res.status === "rejected") {
          console.log("reject ", { res });
        }
      });
    }
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - createNewContributionByYearService");
  }
};

const findAllMembers = async (): Promise<IMember[]> => {
  console.log("IN - findAllMembers");

  const members = await MemberModel.find({}, { _id: 1 }, { lean: true });

  console.log("OUT - findAllMembers");
  return members;
};
