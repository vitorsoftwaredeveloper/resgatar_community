import { VideoModel } from "../../../../src/models/Video";
import * as helperService from "../../../../src/services/helper";
import { removeVideoService } from "../../../../src/services/videos/removeVideo";

const mockVideo = {
  _id: "video-id-123",
  memberId: "member-id-123",
  url: "https://youtu.be/dQw4w9WgXcW",
  videoId: "dQw4w9WgXcW",
};

describe("removeVideoService (integration)", () => {
  let findByIdSpy: jest.SpyInstance;
  let deleteOneSpy: jest.SpyInstance;
  let verifyInternalMemberSpy: jest.SpyInstance;

  beforeEach(() => {
    findByIdSpy = jest
      .spyOn(VideoModel, "findById")
      .mockResolvedValue(mockVideo as any);

    deleteOneSpy = jest
      .spyOn(VideoModel, "deleteOne")
      .mockResolvedValue({} as any);

    verifyInternalMemberSpy = jest
      .spyOn(helperService, "verifyInternalMember")
      .mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should require an internal member before removing", async () => {
    await removeVideoService("member-id-123", "video-id-123");

    expect(verifyInternalMemberSpy).toHaveBeenCalledWith("member-id-123");
  });

  it("should throw and not delete when the caller is a guest", async () => {
    verifyInternalMemberSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    await expect(
      removeVideoService("guest-id-123", "video-id-123"),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(deleteOneSpy).not.toHaveBeenCalled();
  });

  it("should delete the video when owner requests removal", async () => {
    await removeVideoService("member-id-123", "video-id-123");

    expect(deleteOneSpy).toHaveBeenCalledWith({ _id: "video-id-123" });
  });

  it("should throw 404 when video is not found", async () => {
    findByIdSpy.mockResolvedValue(null);

    await expect(removeVideoService("member-id-123", "unknown-id")).rejects.toMatchObject({
      statusCode: 404,
      message: "Video not found.",
    });

    expect(deleteOneSpy).not.toHaveBeenCalled();
  });

  it("should throw 403 when member does not own the video", async () => {
    await expect(removeVideoService("other-member-id", "video-id-123")).rejects.toMatchObject({
      statusCode: 403,
      message: "You are not allowed to remove this video.",
    });

    expect(deleteOneSpy).not.toHaveBeenCalled();
  });

  it("should NOT delete when findById throws", async () => {
    findByIdSpy.mockRejectedValue(new Error("DB error"));

    await expect(removeVideoService("member-id-123", "video-id-123")).rejects.toThrow("DB error");

    expect(deleteOneSpy).not.toHaveBeenCalled();
  });
});
