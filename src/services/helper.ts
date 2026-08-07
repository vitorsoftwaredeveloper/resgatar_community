import { STATUS_CODE } from "../constants";
import { INTERNAL_ROLES, MEMBER_ROLES } from "../constants/members";
import { ContributionModel } from "../models/Contribution";
import { MemberModel } from "../models/Member";
import { IMember } from "../types/members";
import { DashboardVisibilityCardKey } from "../types/dashboardVisibility";
import { getDashboardVisibilitySettings } from "./dashboardVisibility/getDashboardVisibility";

const findMemberById = async (
  memberId: string,
  projection?: any,
  options?: any,
): Promise<IMember> => {
  console.log("IN - findMemberById");

  const member = await MemberModel.findById(memberId, projection, {
    ...options,
    lean: true,
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

const findMemberByEmail = async (
  email: string,
  projection?: any,
): Promise<IMember | null> => {
  console.log("IN - findMemberByEmail");

  const normalizedEmail = email.trim().toLowerCase();
  const member = await MemberModel.findOne(
    { email: normalizedEmail },
    projection,
    { lean: true },
  );

  console.log("OUT - findMemberByEmail");
  return member;
};

const verifyRole = async (
  memberId: string,
  allowedRoles: readonly string[],
): Promise<void> => {
  console.log("IN - verifyRole");

  try {
    const member = await findMemberById(memberId, { role: 1 }, { lean: true });

    if (!allowedRoles.includes(member.role)) {
      throw {
        message: "Unauthorized access",
        statusCode: STATUS_CODE.UNAUTHORIZED,
      };
    }
  } catch (err) {
    throw err;
  }

  console.log("OUT - verifyRole");
};

const verifyAdmin = (memberId: string): Promise<void> =>
  verifyRole(memberId, [MEMBER_ROLES.ADMIN]);

const verifyInternalMember = (memberId: string): Promise<void> =>
  verifyRole(memberId, INTERNAL_ROLES);

const verifyDashboardVisibility = async (
  memberId: string,
  cardKey: DashboardVisibilityCardKey,
): Promise<void> => {
  console.log("IN - verifyDashboardVisibility");

  const member = await findMemberById(memberId, { role: 1 }, { lean: true });

  if ((INTERNAL_ROLES as readonly string[]).includes(member.role)) {
    console.log("OUT - verifyDashboardVisibility");
    return;
  }

  const settings = await getDashboardVisibilitySettings();

  if (!settings[cardKey]) {
    throw {
      message: "Unauthorized access",
      statusCode: STATUS_CODE.UNAUTHORIZED,
    };
  }

  console.log("OUT - verifyDashboardVisibility");
};

const countAdmins = (): Promise<number> =>
  MemberModel.count({ role: MEMBER_ROLES.ADMIN });

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

const ensureContributionForCurrentYear = async (
  memberId: string,
): Promise<void> => {
  console.log("IN - ensureContributionForCurrentYear");

  const now = new Date();
  const year = now.getFullYear();

  const existing = await ContributionModel.findOne(
    { memberId, year },
    { _id: 1 },
    { lean: true },
  );

  if (existing) {
    console.log("Contribution already exists for", { memberId, year });
    console.log("OUT - ensureContributionForCurrentYear");
    return;
  }

  await createContributionByYear(memberId, year, now.getMonth());

  console.log("OUT - ensureContributionForCurrentYear");
};

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

const findAdminPushTokens = async (): Promise<string[]> => {
  const admins = await MemberModel.find(
    { role: MEMBER_ROLES.ADMIN, pushToken: { $ne: null } },
    { pushToken: 1 },
    { lean: true },
  );
  return admins.map((a) => a.pushToken as string);
};

export {
  verifyRole,
  verifyAdmin,
  verifyInternalMember,
  verifyDashboardVisibility,
  countAdmins,
  findMemberById,
  findMemberByEmail,
  createContributionByYear,
  ensureContributionForCurrentYear,
  findAdminPushTokens,
};
