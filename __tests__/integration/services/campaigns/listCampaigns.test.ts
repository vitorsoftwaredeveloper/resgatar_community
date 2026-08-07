import { CampaignModel } from "../../../../src/models/Campaign";
import * as helperService from "../../../../src/services/helper";
import { listCampaignsService } from "../../../../src/services/campaigns/listCampaigns";

const REQUESTER_ID = "member-id-123";

describe("listCampaignsService (integration)", () => {
  let findSpy: jest.SpyInstance;
  let verifyAdminSpy: jest.SpyInstance;
  let verifyDashboardVisibilitySpy: jest.SpyInstance;

  beforeEach(() => {
    findSpy = jest.spyOn(CampaignModel, "find").mockResolvedValue([] as any);
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);
    verifyDashboardVisibilitySpy = jest
      .spyOn(helperService, "verifyDashboardVisibility")
      .mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should require dashboard visibility for banners when listing only active campaigns", async () => {
    await listCampaignsService(REQUESTER_ID);

    expect(verifyDashboardVisibilitySpy).toHaveBeenCalledWith(
      REQUESTER_ID,
      "banners",
    );
    expect(verifyAdminSpy).not.toHaveBeenCalled();
    expect(findSpy).toHaveBeenCalledWith(
      { active: true },
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should throw and not query when guest has banners visibility disabled", async () => {
    verifyDashboardVisibilitySpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    await expect(listCampaignsService(REQUESTER_ID)).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(findSpy).not.toHaveBeenCalled();
  });

  it("should require admin when listing inactive campaigns too", async () => {
    await listCampaignsService(REQUESTER_ID, true);

    expect(verifyAdminSpy).toHaveBeenCalledWith(REQUESTER_ID);
    expect(verifyDashboardVisibilitySpy).not.toHaveBeenCalled();
    expect(findSpy).toHaveBeenCalledWith(
      {},
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should throw and not query when a non-admin requests inactive campaigns", async () => {
    verifyAdminSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    await expect(
      listCampaignsService(REQUESTER_ID, true),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(findSpy).not.toHaveBeenCalled();
  });
});
