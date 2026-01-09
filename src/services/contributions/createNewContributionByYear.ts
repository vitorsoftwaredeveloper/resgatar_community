import { ChargeModel } from "../../models/Charge";
import {
  ICreateChargePayload,
  ICreateChargeMPagoResponse,
  IChargeDTO,
} from "../../types/charges";
import { createMercadoPagoClient } from "../../integrations/mercadopago";
import { PAYMENT_METHOD_ID } from "../../constants/charges";
import { MemberModel } from "../../models/Member";
import { IMember } from "../../types/members";
import { MEMBER_ROLES } from "../../constants/members";
import { STATUS_CODE } from "../../constants";
import { createContributionByYear, findMemberById } from "../helper";
import { ContributionModel } from "../../models/Contribution";

export const createNewContributionByYearService = async (
  memberId: string,
  year: number
): Promise<any> => {
  console.log("IN - createNewContributionByYearService");

  const member: IMember = await findMemberById(memberId);

  if (member.role !== MEMBER_ROLES.ADMIN) {
    throw {
      message: "Unauthorized access",
      statusCode: STATUS_CODE.UNAUTHORIZED,
    };
  }

  try {
    const members = await findAllMembers();

    const result = await Promise.allSettled(
      members.map(({ _id }) => createContributionByYear(_id, year, 0))
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

  const members = await MemberModel.find({}, { _id: 1 });

  console.log("OUT - findAllMembers");
  return members;
};
