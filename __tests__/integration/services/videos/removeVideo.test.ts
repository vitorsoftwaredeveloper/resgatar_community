import { VideoModel } from "../../../../src/models/Video";
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

  beforeEach(() => {
    findByIdSpy = jest
      .spyOn(VideoModel, "findById")
      .mockResolvedValue(mockVideo as any);

    deleteOneSpy = jest
      .spyOn(VideoModel, "deleteOne")
      .mockResolvedValue({} as any);
  });

  afterEach(() => jest.restoreAllMocks());

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
