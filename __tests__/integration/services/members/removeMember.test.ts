import * as helperService from "../../../../src/services/helper";
import * as cognitoUtil from "../../../../src/utils/cognito";
import { MemberModel } from "../../../../src/models/Member";
import { ContributionModel } from "../../../../src/models/Contribution";
import { ChargeModel } from "../../../../src/models/Charge";
import { VideoModel } from "../../../../src/models/Video";
import { removeMemberService } from "../../../../src/services/members/removeMember";

describe("removeMemberService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let removeMemberCognitoSpy: jest.SpyInstance;
  let deleteOneMemberSpy: jest.SpyInstance;
  let deleteManyContributionSpy: jest.SpyInstance;
  let deleteManyChargeSpy: jest.SpyInstance;
  let deleteManyVideoSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    removeMemberCognitoSpy = jest
      .spyOn(cognitoUtil, "removeMemberCognito")
      .mockResolvedValue(undefined);

    deleteOneMemberSpy = jest
      .spyOn(MemberModel, "deleteOne")
      .mockResolvedValue({} as any);

    deleteManyContributionSpy = jest
      .spyOn(ContributionModel, "deleteMany")
      .mockResolvedValue({} as any);

    deleteManyChargeSpy = jest
      .spyOn(ChargeModel, "deleteMany")
      .mockResolvedValue({} as any);

    deleteManyVideoSpy = jest
      .spyOn(VideoModel, "deleteMany")
      .mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should verify admin when requester removes another member", async () => {
    await removeMemberService("admin-id", "member-id");

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should NOT call verifyAdmin when member closes their own account", async () => {
    await removeMemberService("member-id", "member-id");

    expect(verifyAdminSpy).not.toHaveBeenCalled();
  });

  it("should allow member to close their own account", async () => {
    await removeMemberService("member-id", "member-id");

    expect(removeMemberCognitoSpy).toHaveBeenCalledWith("member-id");
    expect(deleteOneMemberSpy).toHaveBeenCalledWith({ _id: "member-id" });
  });

  it("should throw 401 when non-admin tries to remove another member", async () => {
    verifyAdminSpy.mockRejectedValue({ statusCode: 401, message: "Unauthorized access" });

    await expect(removeMemberService("user-id", "member-id")).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(removeMemberCognitoSpy).not.toHaveBeenCalled();
  });

  it("should remove member from Cognito", async () => {
    await removeMemberService("admin-id", "member-id");

    expect(removeMemberCognitoSpy).toHaveBeenCalledWith("member-id");
  });

  it("should delete member document from DB", async () => {
    await removeMemberService("admin-id", "member-id");

    expect(deleteOneMemberSpy).toHaveBeenCalledWith({ _id: "member-id" });
  });

  it("should delete all contributions of the member", async () => {
    await removeMemberService("admin-id", "member-id");

    expect(deleteManyContributionSpy).toHaveBeenCalledWith({ memberId: "member-id" });
  });

  it("should delete all charges of the member", async () => {
    await removeMemberService("admin-id", "member-id");

    expect(deleteManyChargeSpy).toHaveBeenCalledWith({ memberId: "member-id" });
  });

  it("should delete all videos of the member", async () => {
    await removeMemberService("admin-id", "member-id");

    expect(deleteManyVideoSpy).toHaveBeenCalledWith({ memberId: "member-id" });
  });

  it("should delete member, contributions, charges and videos in parallel", async () => {
    const order: string[] = [];

    deleteOneMemberSpy.mockImplementation(async () => { order.push("member"); return {}; });
    deleteManyContributionSpy.mockImplementation(async () => { order.push("contribution"); return {}; });
    deleteManyChargeSpy.mockImplementation(async () => { order.push("charge"); return {}; });
    deleteManyVideoSpy.mockImplementation(async () => { order.push("video"); return {}; });

    await removeMemberService("admin-id", "member-id");

    expect(order).toHaveLength(4);
    expect(order).toEqual(expect.arrayContaining(["member", "contribution", "charge", "video"]));
  });

  it("should throw when Cognito removal fails", async () => {
    removeMemberCognitoSpy.mockRejectedValue(new Error("Cognito error"));

    await expect(removeMemberService("admin-id", "member-id")).rejects.toThrow("Cognito error");

    expect(deleteOneMemberSpy).not.toHaveBeenCalled();
  });
});
