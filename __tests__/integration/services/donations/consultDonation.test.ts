import * as helperService from "../../../../src/services/helper";
import { DonationModel } from "../../../../src/models/Donation";
import { consultDonationService } from "../../../../src/services/donations/consultDonation";
import { TRANSACTION_STATUS } from "../../../../src/constants/charges";

const mockDonation = {
  transactionId: "99001",
  memberId: "member-1",
  amount: "50,00",
  status: TRANSACTION_STATUS.APPROVED,
};

describe("consultDonationService (integration)", () => {
  let findMemberByIdSpy: jest.SpyInstance;
  let findOneSpy: jest.SpyInstance;

  beforeEach(() => {
    findMemberByIdSpy = jest
      .spyOn(helperService, "findMemberById")
      .mockResolvedValue({ _id: "member-1" } as any);

    findOneSpy = jest
      .spyOn(DonationModel, "findOne")
      .mockResolvedValue(mockDonation as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should validate that the member exists", async () => {
    await consultDonationService("member-1", "99001");

    expect(findMemberByIdSpy).toHaveBeenCalledWith("member-1");
  });

  it("should scope the query by both transactionId and memberId so a member cannot see another member's donation", async () => {
    await consultDonationService("member-1", "99001");

    expect(findOneSpy).toHaveBeenCalledWith(
      { transactionId: "99001", memberId: "member-1" },
      {},
      expect.objectContaining({ lean: true }),
    );
  });

  it("should return the donation when found", async () => {
    const result = await consultDonationService("member-1", "99001");

    expect(result).toEqual(mockDonation);
  });

  it("should throw 404 when donation is not found", async () => {
    findOneSpy.mockResolvedValue(null);

    await expect(
      consultDonationService("member-1", "unknown-id"),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("should throw when the member does not exist", async () => {
    findMemberByIdSpy.mockRejectedValue({ message: "Member not found", statusCode: 404 });

    await expect(
      consultDonationService("ghost", "99001"),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(findOneSpy).not.toHaveBeenCalled();
  });
});
