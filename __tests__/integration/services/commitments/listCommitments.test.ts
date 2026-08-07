import { CommitmentModel } from "../../../../src/models/Commitment";
import * as helperService from "../../../../src/services/helper";
import { listCommitmentsService } from "../../../../src/services/commitments/listCommitments";

describe("listCommitmentsService (integration)", () => {
  let findSpy: jest.SpyInstance;
  let verifyInternalMemberSpy: jest.SpyInstance;

  beforeEach(() => {
    findSpy = jest.spyOn(CommitmentModel, "find").mockResolvedValue([] as any);

    verifyInternalMemberSpy = jest
      .spyOn(helperService, "verifyInternalMember")
      .mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should require an internal member before listing", async () => {
    await listCommitmentsService("user-id");

    expect(verifyInternalMemberSpy).toHaveBeenCalledWith("user-id");
  });

  it("should throw and not query when caller is a guest", async () => {
    verifyInternalMemberSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    await expect(listCommitmentsService("guest-id")).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(findSpy).not.toHaveBeenCalled();
  });
});
