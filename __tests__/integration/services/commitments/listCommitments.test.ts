import { CommitmentModel } from "../../../../src/models/Commitment";
import * as helperService from "../../../../src/services/helper";
import { listCommitmentsService } from "../../../../src/services/commitments/listCommitments";

describe("listCommitmentsService (integration)", () => {
  let findSpy: jest.SpyInstance;
  let verifyDashboardVisibilitySpy: jest.SpyInstance;

  beforeEach(() => {
    findSpy = jest.spyOn(CommitmentModel, "find").mockResolvedValue([] as any);

    verifyDashboardVisibilitySpy = jest
      .spyOn(helperService, "verifyDashboardVisibility")
      .mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should require dashboard visibility for notices before listing", async () => {
    await listCommitmentsService("user-id");

    expect(verifyDashboardVisibilitySpy).toHaveBeenCalledWith(
      "user-id",
      "notices",
    );
  });

  it("should throw and not query when caller is a guest without notices visibility", async () => {
    verifyDashboardVisibilitySpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    await expect(listCommitmentsService("guest-id")).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(findSpy).not.toHaveBeenCalled();
  });
});
