import { DashboardVisibilitySettingsModel } from "../../../../src/models/DashboardVisibilitySettings";
import { updateDashboardVisibilityService } from "../../../../src/services/dashboardVisibility/updateDashboardVisibility";
import * as helperService from "../../../../src/services/helper";

describe("updateDashboardVisibilityService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let updateOneSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    updateOneSpy = jest
      .spyOn(DashboardVisibilitySettingsModel, "updateOne")
      .mockResolvedValue(undefined as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should require admin before persisting", async () => {
    await updateDashboardVisibilityService("admin-id-123", { notices: true });

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id-123");
  });

  it("should upsert the singleton document with only the given fields", async () => {
    await updateDashboardVisibilityService("admin-id-123", {
      notices: true,
      birthdays: false,
    });

    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "singleton" },
      {
        $set: { notices: true, birthdays: false, adminId: "admin-id-123" },
      },
      { upsert: true },
    );
  });

  it("should throw and not persist when caller is not admin", async () => {
    verifyAdminSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    await expect(
      updateDashboardVisibilityService("guest-id-123", { notices: true }),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(updateOneSpy).not.toHaveBeenCalled();
  });
});
