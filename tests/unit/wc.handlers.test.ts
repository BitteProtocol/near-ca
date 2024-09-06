import { Hex, isHex, toHex } from "viem";
import { requestRouter } from "../../src";

describe("Wallet Connect", () => {
  const chainId = 11155111;
  const from = "0xa61d98854f7ab25402e3d12548a2e93a080c1f97" as Hex;
  const to = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14" as Hex;

  describe("requestRouter: eth_sign & personal_sign", () => {
    it("hello message", async () => {
      const messageString = "Hello!";
      const { evmMessage, payload } = await requestRouter({
        method: "eth_sign",
        chainId,
        params: [from, toHex(messageString)],
      });
      expect(evmMessage).toEqual(messageString);
      expect(payload).toEqual([
        82, 182, 67, 125, 181, 109, 135, 245, 153, 29, 124, 23, 60, 241, 27,
        157, 208, 249, 251, 8, 50, 96, 190, 241, 191, 12, 51, 128, 66, 188, 57,
        140,
      ]);
    });

    it("opensea login", async () => {
      const { evmMessage, payload } = await requestRouter({
        method: "personal_sign",
        chainId,
        params: [
          "0x57656c636f6d6520746f204f70656e536561210a0a436c69636b20746f207369676e20696e20616e642061636365707420746865204f70656e536561205465726d73206f662053657276696365202868747470733a2f2f6f70656e7365612e696f2f746f732920616e64205072697661637920506f6c696379202868747470733a2f2f6f70656e7365612e696f2f70726976616379292e0a0a5468697320726571756573742077696c6c206e6f742074726967676572206120626c6f636b636861696e207472616e73616374696f6e206f7220636f737420616e792067617320666565732e0a0a57616c6c657420616464726573733a0a3078663131633232643631656364376231616463623662343335343266653861393662393332386463370a0a4e6f6e63653a0a32393731633731312d623739382d343433342d613633312d316333663133656665353365",
          "0xf11c22d61ecd7b1adcb6b43542fe8a96b9328dc7",
        ],
      });
      expect(evmMessage).toEqual(
        `Welcome to OpenSea!

Click to sign in and accept the OpenSea Terms of Service (https://opensea.io/tos) and Privacy Policy (https://opensea.io/privacy).

This request will not trigger a blockchain transaction or cost any gas fees.

Wallet address:
0xf11c22d61ecd7b1adcb6b43542fe8a96b9328dc7

Nonce:
2971c711-b798-4434-a631-1c3f13efe53e`
      );
      expect(payload).toEqual([
        71, 1, 115, 38, 85, 102, 123, 176, 168, 180, 141, 217, 92, 92, 166, 4,
        91, 203, 111, 233, 203, 169, 63, 13, 203, 186, 161, 2, 249, 195, 231,
        219,
      ]);
    });

    it("manifold login", async () => {
      const { evmMessage, payload } = await requestRouter({
        method: "personal_sign",
        chainId,
        params: [
          "0x506c65617365207369676e2074686973206d65737361676520746f20616363657373204d616e69666f6c642053747564696f0a0a4368616c6c656e67653a2034313133666333616232636336306635643539356232653535333439663165656335366664306337306434323837303831666537313536383438323633363236",
          "0xf11c22d61ecd7b1adcb6b43542fe8a96b9328dc7",
        ],
      });
      expect(evmMessage).toEqual(
        `Please sign this message to access Manifold Studio

Challenge: 4113fc3ab2cc60f5d595b2e55349f1eec56fd0c70d4287081fe7156848263626`
      );
      expect(payload).toEqual([
        104, 1, 31, 81, 200, 177, 165, 108, 41, 241, 209, 48, 196, 129, 215, 86,
        73, 102, 254, 229, 27, 107, 59, 110, 214, 33, 221, 45, 156, 197, 164,
        211,
      ]);
    });
  });
  describe("requestRouter: eth_sendTransaction", () => {
    /// can't test payload: its non-deterministic because of gas values!
    it("with value", async () => {
      const { evmMessage } = await requestRouter({
        method: "eth_sendTransaction",
        chainId,
        params: [
          {
            gas: "0xd31d",
            value: "0x16345785d8a0000",
            from,
            to,
            data: "0xd0e30db0",
          },
        ],
      });
      expect(isHex(evmMessage)).toBe(true);
    });

    it("null value", async () => {
      const { evmMessage } = await requestRouter({
        method: "eth_sendTransaction",
        chainId,
        params: [
          {
            gas: "0xa8c3",
            from,
            to,
            data: "0x2e1a7d4d000000000000000000000000000000000000000000000000002386f26fc10000",
          },
        ],
      });

      expect(isHex(evmMessage)).toBe(true);
    });

    it("null data", async () => {
      const { evmMessage } = await requestRouter({
        method: "eth_sendTransaction",
        chainId,
        params: [
          {
            gas: "0xa8c3",
            from,
            to,
            value: "0x01",
          },
        ],
      });

      expect(isHex(evmMessage)).toBe(true);
    });
  });
  describe("requestRouter: eth_signTypedData", () => {
    it("Cowswap Order", async () => {
      const jsonStr = `{
      "types": {
        "Permit": [
          {"name": "owner", "type": "address"},
          {"name": "spender", "type": "address"},
          {"name": "value", "type": "uint256"},
          {"name": "nonce", "type": "uint256"},
          {"name": "deadline", "type": "uint256"}
        ],
        "EIP712Domain": [
          {"name": "name", "type": "string"},
          {"name": "version", "type": "string"},
          {"name": "chainId", "type": "uint256"},
          {"name": "verifyingContract", "type": "address"}
        ]
      },
      "domain": {
        "name": "CoW Protocol Token",
        "version": "1",
        "chainId": "11155111",
        "verifyingContract": "0x0625afb445c3b6b7b929342a04a22599fd5dbb59"
      },
      "primaryType": "Permit",
      "message": {
        "owner": "0xa61d98854f7ab25402e3d12548a2e93a080c1f97",
        "spender": "0xc92e8bdf79f0507f65a392b0ab4667716bfe0110",
        "value": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        "nonce": "0",
        "deadline": "1872873982"
      }
    }`;
      const request = {
        method: "eth_signTypedData_v4",
        params: [from, jsonStr],
      };

      const { evmMessage, payload } = await requestRouter({
        method: "eth_signTypedData_v4",
        chainId,
        params: [from, jsonStr],
      });
      expect(evmMessage).toEqual(request.params[1]);
      expect(payload).toEqual([
        12, 48, 228, 237, 112, 46, 184, 104, 131, 82, 168, 85, 19, 250, 126, 53,
        144, 249, 197, 39, 93, 218, 12, 56, 42, 161, 212, 122, 176, 197, 201,
        154,
      ]);
    });
  });
});
