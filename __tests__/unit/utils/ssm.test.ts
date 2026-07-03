import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { getSsmParameter } from "../../../src/utils/ssm";

beforeEach(() => {
  process.env.REGION = "us-east-1";
});

afterEach(() => {
  delete process.env.REGION;
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe("getSsmParameter", () => {
  it("should fetch the parameter value with decryption enabled", async () => {
    const sendSpy = jest
      .spyOn(SSMClient.prototype, "send")
      .mockResolvedValue({ Parameter: { Value: "secret-value" } } as never);

    const value = await getSsmParameter("/resgatar_community/some-fresh-param");

    expect(value).toBe("secret-value");
    const command = sendSpy.mock.calls[0][0] as GetParameterCommand;
    expect(command).toBeInstanceOf(GetParameterCommand);
    expect(command.input).toEqual({
      Name: "/resgatar_community/some-fresh-param",
      WithDecryption: true,
    });
  });

  it("should cache the value and not call SSM again for the same name", async () => {
    const sendSpy = jest
      .spyOn(SSMClient.prototype, "send")
      .mockResolvedValue({ Parameter: { Value: "cached-value" } } as never);

    const name = "/resgatar_community/cached-param";
    await getSsmParameter(name);
    await getSsmParameter(name);
    await getSsmParameter(name);

    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it("should throw when the parameter is missing or empty", async () => {
    jest
      .spyOn(SSMClient.prototype, "send")
      .mockResolvedValue({ Parameter: { Value: undefined } } as never);

    await expect(
      getSsmParameter("/resgatar_community/missing-param")
    ).rejects.toThrow('SSM parameter "/resgatar_community/missing-param"');
  });
});
