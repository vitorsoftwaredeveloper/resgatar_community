import { DashboardVisibilitySettingsModel } from "../../../../src/models/DashboardVisibilitySettings";
import { getDashboardVisibilitySettings } from "../../../../src/services/dashboardVisibility/getDashboardVisibility";

describe("getDashboardVisibilitySettings (integration)", () => {
  let findOneSpy: jest.SpyInstance;

  beforeEach(() => {
    findOneSpy = jest.spyOn(DashboardVisibilitySettingsModel, "findOne");
  });

  afterEach(() => jest.restoreAllMocks());

  it("should return the persisted settings when a document exists", async () => {
    findOneSpy.mockResolvedValue({
      notices: true,
      communityGoal: false,
      birthdays: true,
      banners: false,
      videos: false,
    } as any);

    await expect(getDashboardVisibilitySettings()).resolves.toEqual({
      notices: true,
      communityGoal: false,
      birthdays: true,
      banners: false,
      videos: false,
    });
  });

  it("should fall back to defaults when no document exists yet", async () => {
    findOneSpy.mockResolvedValue(null);

    await expect(getDashboardVisibilitySettings()).resolves.toEqual({
      notices: false,
      communityGoal: false,
      birthdays: false,
      banners: true,
      videos: true,
    });
  });
});
