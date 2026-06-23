import { extractVideoId, buildThumbnailUrl } from "../../../src/utils/youtube";

describe("youtube utils", () => {
  describe("extractVideoId", () => {
    it("should extract videoId from youtube.com/watch?v= URL", () => {
      expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcW")).toBe("dQw4w9WgXcW");
    });

    it("should extract videoId from youtu.be short URL", () => {
      expect(extractVideoId("https://youtu.be/dQw4w9WgXcW")).toBe("dQw4w9WgXcW");
    });

    it("should extract videoId when URL has extra query params", () => {
      expect(
        extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcW&t=120&list=PLxxx"),
      ).toBe("dQw4w9WgXcW");
    });

    it("should extract videoId when v= is not the first param", () => {
      expect(
        extractVideoId("https://www.youtube.com/watch?list=PLxxx&v=dQw4w9WgXcW"),
      ).toBe("dQw4w9WgXcW");
    });

    it("should extract videoId from youtube.com/shorts/ URL", () => {
      expect(extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcW")).toBe("dQw4w9WgXcW");
    });

    it("should return null for a YouTube channel URL", () => {
      expect(extractVideoId("https://www.youtube.com/channel/UCxxx")).toBeNull();
    });

    it("should return null for non-YouTube URLs", () => {
      expect(extractVideoId("https://vimeo.com/123456789")).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(extractVideoId("")).toBeNull();
    });
  });

  describe("buildThumbnailUrl", () => {
    it("should return the hqdefault thumbnail URL for a videoId", () => {
      expect(buildThumbnailUrl("dQw4w9WgXcW")).toBe(
        "https://img.youtube.com/vi/dQw4w9WgXcW/hqdefault.jpg",
      );
    });
  });
});
