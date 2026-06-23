import { APIGatewayEvent } from "aws-lambda";
import * as listAllVideosServiceModule from "../../../../src/services/videos/listAllVideos";
import { execute } from "../../../../src/handlers/videos/listAllVideos";

const mockVideos = [
  {
    _id: "v1",
    memberId: "m1",
    videoId: "abc1234abcd",
    thumbnail: "https://img.youtube.com/vi/abc1234abcd/hqdefault.jpg",
    url: "https://youtu.be/abc1234abcd",
    firstName: "João",
    lastName: "Silva",
    profileImage: null,
  },
];

function buildEvent(): APIGatewayEvent {
  return { body: null, headers: {} } as any;
}

describe("listAllVideos handler (integration)", () => {
  let listAllVideosSpy: jest.SpyInstance;

  beforeEach(() => {
    listAllVideosSpy = jest
      .spyOn(listAllVideosServiceModule, "listAllVideosService")
      .mockResolvedValue(mockVideos as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should return 200 with the videos list", async () => {
    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]._id).toBe("v1");
  });

  it("should return 200 with empty array when no videos exist", async () => {
    listAllVideosSpy.mockResolvedValue([]);

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data).toHaveLength(0);
  });

  it("should return 500 when service throws", async () => {
    listAllVideosSpy.mockRejectedValue(new Error("DB failure"));

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(500);
  });

  it("should call listAllVideosService once", async () => {
    await execute(buildEvent());

    expect(listAllVideosSpy).toHaveBeenCalledTimes(1);
  });
});
