import { Hex, isHex, toHex } from "viem";
import { requestRouter } from "../../src";

describe("Wallet Connect", () => {
  const chainId = 11155111;
  const from = "0xa61d98854f7ab25402e3d12548a2e93a080c1f97" as Hex;
  const to = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14" as Hex;

  describe("requestRouter: eth_sign & personal_sign", () => {
    it("hello message", async () => {
      const messageString = "Hello!";
      const { evmMessage, hashToSign } = await requestRouter({
        method: "eth_sign",
        chainId,
        params: [from, toHex(messageString)],
      });
      expect(evmMessage).toEqual(messageString);
      expect(hashToSign).toEqual(
        "0x52b6437db56d87f5991d7c173cf11b9dd0f9fb083260bef1bf0c338042bc398c"
      );
    });

    it("opensea login", async () => {
      const { evmMessage, hashToSign } = await requestRouter({
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
      expect(hashToSign).toEqual(
        "0x4701732655667bb0a8b48dd95c5ca6045bcb6fe9cba93f0dcbbaa102f9c3e7db"
      );
    });

    it("manifold login", async () => {
      const { evmMessage, hashToSign } = await requestRouter({
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
      expect(hashToSign).toEqual(
        "0x68011f51c8b1a56c29f1d130c481d7564966fee51b6b3b6ed621dd2d9cc5a4d3"
      );
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

      const { evmMessage, hashToSign } = await requestRouter({
        method: "eth_signTypedData_v4",
        chainId,
        params: [from, jsonStr],
      });
      expect(evmMessage).toEqual(request.params[1]);
      expect(hashToSign).toEqual(
        "0x0c30e4ed702eb8688352a85513fa7e3590f9c5275dda0c382aa1d47ab0c5c99a"
      );
    });
  });
});
