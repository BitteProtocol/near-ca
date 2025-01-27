import { convertToAction, convertToCompatibleFormat } from "../../src/types";
describe("types/utils", () => {
  it("convertToAction", async () => {
    const action = convertToAction({
      type: "FunctionCall",
      params: {
        methodName: "sign",
        args: {
          request: {
            path: "x",
            payload: [1],
            key_version: 1,
          },
        },
        gas: "1",
        deposit: "2",
      },
    });
    expect(action.functionCall).toBeDefined();
  });

  it("convertToCompatibleFormat success", async () => {
    const args = {
      request: {
        path: "x",
        payload: [1],
        key_version: 1,
      },
    };
    expect(convertToCompatibleFormat(args)).toBe(args);
    expect(convertToCompatibleFormat(1)).toStrictEqual(
      new TextEncoder().encode("1")
    );
  });

  it("convertToCompatibleFormat fails", async () => {
    expect(() => convertToCompatibleFormat(1n)).toThrow(
      "Failed to convert the input: Do not know how to serialize a BigInt"
    );
  });
});
