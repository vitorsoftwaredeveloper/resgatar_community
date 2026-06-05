import { STATUS_CODE } from "../constants";
import { MEMBER_ROLES } from "../constants/members";
import { ContributionModel } from "../models/Contribution";
import { MemberModel } from "../models/Member";
import { IMember } from "../types/members";

const findMemberById = async (
  memberId: string,
  projection?: any,
  options?: any,
): Promise<IMember> => {
  console.log("IN - findMemberById");

  const member = await MemberModel.findById(memberId, projection, {
    ...options,
  });
  if (!member) {
    throw {
      message: "Member not found",
      statusCode: STATUS_CODE.NOT_FOUND,
    };
  }

  console.log("Member found:", member._id);

  console.log("OUT - findMemberById");
  return member;
};

const verifyAdmin = async (memberId: string): Promise<void> => {
  console.log("IN - verifyAdmin");

  try {
    const member = await findMemberById(memberId);

    if (!(member.role === MEMBER_ROLES.ADMIN)) {
      throw {
        message: "Unauthorized access",
        statusCode: STATUS_CODE.UNAUTHORIZED,
      };
    }
  } catch (err) {
    throw err;
  }

  console.log("OUT - verifyAdmin");
};

const createContributionByYear = (
  memberId: string,
  year: number,
  monthIndex: number,
) =>
  ContributionModel.insertOne({
    memberId,
    year,
    months: getRemainingMonthsFromNow(monthIndex),
  });

function getRemainingMonthsFromNow(monthIndex: number) {
  const monthKeys = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  return monthKeys.reduce((acc, month, index) => {
    if (index >= monthIndex) {
      acc[month] = {
        paid: false,
      };
    }
    return acc;
  }, {} as any);
}

export { verifyAdmin, findMemberById, createContributionByYear };
