import { Hex, TransactionSerializable, serializeSignature, toHex } from "viem";
import {
  EthTransactionParams,
  PersonalSignParams,
  offChainRecovery,
  wcRouter,
} from "../../src/wallet-connect/handlers";
import { MessageData, TypedMessageData } from "../../src/types/types";

describe("Wallet Connect", () => {
  const chainId = "eip155:11155111";
  const from = "0xa61d98854f7ab25402e3d12548a2e93a080c1f97";
  const to = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";

  describe("wcRouter: eth_sign & personal_sign", () => {
    it("hello message", async () => {
      const messageString = "Hello!";
      const request = {
        method: "eth_sign",
        params: [from, toHex(messageString)],
      };

      const { evmMessage, payload } = await wcRouter(
        request.method,
        chainId,
        request.params as PersonalSignParams
      );
      expect(evmMessage).toEqual(messageString);
      expect(payload).toEqual([
        140, 57, 188, 66, 128, 51, 12, 191, 241, 190, 96, 50, 8, 251, 249, 208,
        157, 27, 241, 60, 23, 124, 29, 153, 245, 135, 109, 181, 125, 67, 182,
        82,
      ]);
    });

    it("fail with wrong method", async () => {
      const messageString = "Hello!";
      const request = {
        method: "eth_fail",
        params: [from, toHex(messageString)],
      };

      await expect(
        wcRouter(request.method, chainId, request.params as PersonalSignParams)
      ).rejects.toThrow("Unhandled session_request method: eth_fail");
    });

    it("opensea login", async () => {
      const request = {
        method: "personal_sign",
        params: [
          "0x57656c636f6d6520746f204f70656e536561210a0a436c69636b20746f207369676e20696e20616e642061636365707420746865204f70656e536561205465726d73206f662053657276696365202868747470733a2f2f6f70656e7365612e696f2f746f732920616e64205072697661637920506f6c696379202868747470733a2f2f6f70656e7365612e696f2f70726976616379292e0a0a5468697320726571756573742077696c6c206e6f742074726967676572206120626c6f636b636861696e207472616e73616374696f6e206f7220636f737420616e792067617320666565732e0a0a57616c6c657420616464726573733a0a3078663131633232643631656364376231616463623662343335343266653861393662393332386463370a0a4e6f6e63653a0a32393731633731312d623739382d343433342d613633312d316333663133656665353365",
          "0xf11c22d61ecd7b1adcb6b43542fe8a96b9328dc7",
        ],
      };

      const { evmMessage, payload } = await wcRouter(
        request.method,
        chainId,
        request.params as PersonalSignParams
      );
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
        219, 231, 195, 249, 2, 161, 186, 203, 13, 63, 169, 203, 233, 111, 203,
        91, 4, 166, 92, 92, 217, 141, 180, 168, 176, 123, 102, 85, 38, 115, 1,
        71,
      ]);
    });

    it("manifold login", async () => {
      const request = {
        method: "personal_sign",
        params: [
          "0x506c65617365207369676e2074686973206d65737361676520746f20616363657373204d616e69666f6c642053747564696f0a0a4368616c6c656e67653a2034313133666333616232636336306635643539356232653535333439663165656335366664306337306434323837303831666537313536383438323633363236",
          "0xf11c22d61ecd7b1adcb6b43542fe8a96b9328dc7",
        ],
      };

      const { evmMessage, payload } = await wcRouter(
        request.method,
        chainId,
        request.params as PersonalSignParams
      );
      expect(evmMessage).toEqual(
        `Please sign this message to access Manifold Studio

Challenge: 4113fc3ab2cc60f5d595b2e55349f1eec56fd0c70d4287081fe7156848263626`
      );
      expect(payload).toEqual([
        211, 164, 197, 156, 45, 221, 33, 214, 110, 59, 107, 27, 229, 254, 102,
        73, 86, 215, 129, 196, 48, 209, 241, 41, 108, 165, 177, 200, 81, 31, 1,
        104,
      ]);
    });
  });
  describe("wcRouter: eth_sendTransaction", () => {
    it("with value", async () => {
      const request = {
        method: "eth_sendTransaction",
        params: [
          {
            gas: "0xd31d",
            value: "0x16345785d8a0000",
            from,
            to,
            data: "0xd0e30db0",
          },
        ],
      };

      const { evmMessage } = await wcRouter(
        request.method,
        chainId,
        request.params as EthTransactionParams[]
      );
      const tx = evmMessage as TransactionSerializable;

      delete tx.maxFeePerGas;
      delete tx.maxPriorityFeePerGas;
      delete tx.nonce;

      expect(tx).toEqual({
        account: from,
        chainId: 11155111,
        data: "0xd0e30db0",
        gas: 54045n,
        to,
        value: 100000000000000000n,
      });
      /// can't test payload: its non-deterministic because of gas values!
    });

    it("null value", async () => {
      const request = {
        method: "eth_sendTransaction",
        params: [
          {
            gas: "0xa8c3",
            from,
            to,
            data: "0x2e1a7d4d000000000000000000000000000000000000000000000000002386f26fc10000",
          },
        ],
      };

      const { evmMessage } = await wcRouter(
        request.method,
        chainId,
        request.params as EthTransactionParams[]
      );
      const tx = evmMessage as TransactionSerializable;

      delete tx.maxFeePerGas;
      delete tx.maxPriorityFeePerGas;
      delete tx.nonce;

      expect(tx).toEqual({
        account: from,
        chainId: 11155111,
        data: "0x2e1a7d4d000000000000000000000000000000000000000000000000002386f26fc10000",
        gas: 43203n,
        to,
        value: 0n,
      });
      /// can't test payload: its non-deterministic because of gas values!
    });

    it("null data", async () => {
      const request = {
        method: "eth_sendTransaction",
        params: [
          {
            gas: "0xa8c3",
            from,
            to,
            value: "0x01",
          },
        ],
      };

      const { evmMessage } = await wcRouter(
        request.method,
        chainId,
        request.params as EthTransactionParams[]
      );
      const tx = evmMessage as TransactionSerializable;

      delete tx.maxFeePerGas;
      delete tx.maxPriorityFeePerGas;
      delete tx.nonce;

      expect(tx).toEqual({
        account: from,
        chainId: 11155111,
        data: "0x",
        gas: 43203n,
        to,
        value: 1n,
      });
      /// can't test payload: its non-deterministic because of gas values!
    });
  });
  describe("wcRouter: eth_signTypedData", () => {
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

      const { evmMessage, payload } = await wcRouter(
        request.method,
        chainId,
        request.params as PersonalSignParams
      );
      expect(evmMessage).toEqual(request.params[1]);
      expect(payload).toEqual([
        154, 201, 197, 176, 122, 212, 161, 42, 56, 12, 218, 93, 39, 197, 249,
        144, 53, 126, 250, 19, 85, 168, 82, 131, 104, 184, 46, 112, 237, 228,
        48, 12,
      ]);
    });
  });

  describe("offChainRecovery: personal_sign", () => {
    it("recovering signature", async () => {
      const recoveryData = {
        type: "personal_sign",
        data: {
          address: "0xf11c22d61ecd7b1adcb6b43542fe8a96b9328dc7",
          message: {
            raw: "0x57656c636f6d6520746f204f70656e536561210a0a436c69636b20746f207369676e20696e20616e642061636365707420746865204f70656e536561205465726d73206f662053657276696365202868747470733a2f2f6f70656e7365612e696f2f746f732920616e64205072697661637920506f6c696379202868747470733a2f2f6f70656e7365612e696f2f70726976616379292e0a0a5468697320726571756573742077696c6c206e6f742074726967676572206120626c6f636b636861696e207472616e73616374696f6e206f7220636f737420616e792067617320666565732e0a0a57616c6c657420616464726573733a0a3078663131633232643631656364376231616463623662343335343266653861393662393332386463370a0a4e6f6e63653a0a63336432623238622d623964652d346239662d383935362d316336663739373133613431",
          },
        } as MessageData,
      };
      const r =
        "0x491E245DB3914B85807F3807F2125B9ED9722D0E9F3FA0FE325B31893FA5E693";
      const s =
        "0x387178AE4A51F304556C1B2E9DD24F1120D073F93017AF006AD801A639214EA6";
      const sigs: [Hex, Hex] = [
        serializeSignature({ r, s, yParity: 0 }),
        serializeSignature({ r, s, yParity: 1 }),
      ];

      const signature = await offChainRecovery(recoveryData, sigs);
      expect(signature).toEqual(
        "0x491e245db3914b85807f3807f2125b9ed9722d0e9f3fa0fe325b31893fa5e693387178ae4a51f304556c1b2e9dd24f1120d073f93017af006ad801a639214ea61b"
      );
    });

    it("recovering eth_signTypedData", async () => {
      // TODO: Find a real examples of Ethereum apps and simulate them on the test
      const recoveryData = {
        type: "eth_signTypedData",
        data: {
          address: "0xf11c22d61ecd7b1adcb6b43542fe8a96b9328dc7",
          message: {
            from: {
              name: "Cow",
              wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
            },
            to: {
              name: "Bob",
              wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
            },
            contents: "Hello, Bob!",
          },
          types: {
            Person: [
              { name: "name", type: "string" },
              { name: "wallet", type: "address" },
            ],
            Mail: [
              { name: "from", type: "Person" },
              { name: "to", type: "Person" },
              { name: "contents", type: "string" },
            ],
          },
          primaryType: "Mail",
          domain: {
            name: "Ether Mail",
            version: "1",
            chainId: 1,
            verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
          },
        } as TypedMessageData,
      };
      const r =
        "0x491E245DB3914B85807F3807F2125B9ED9722D0E9F3FA0FE325B31893FA5E693";
      const s =
        "0x387178AE4A51F304556C1B2E9DD24F1120D073F93017AF006AD801A639214EA6";
      const sigs: [Hex, Hex] = [
        serializeSignature({ r, s, yParity: 0 }),
        serializeSignature({ r, s, yParity: 1 }),
      ];

      await expect(offChainRecovery(recoveryData, sigs)).rejects.toThrow(
        "Invalid signature"
      );
    });

    it("fail with wrong type", async () => {
      const recoveryData = {
        type: "wrong_type",
        data: {
          address: "0xf11c22d61ecd7b1adcb6b43542fe8a96b9328dc7",
          message: {
            raw: "0x57656c636f6d6520746f204f70656e536561210a0a436c69636b20746f207369676e20696e20616e642061636365707420746865204f70656e536561205465726d73206f662053657276696365202868747470733a2f2f6f70656e7365612e696f2f746f732920616e64205072697661637920506f6c696379202868747470733a2f2f6f70656e7365612e696f2f70726976616379292e0a0a5468697320726571756573742077696c6c206e6f742074726967676572206120626c6f636b636861696e207472616e73616374696f6e206f7220636f737420616e792067617320666565732e0a0a57616c6c657420616464726573733a0a3078663131633232643631656364376231616463623662343335343266653861393662393332386463370a0a4e6f6e63653a0a63336432623238622d623964652d346239662d383935362d316336663739373133613431",
          },
        } as MessageData,
      };
      const r =
        "0x491E245DB3914B85807F3807F2125B9ED9722D0E9F3FA0FE325B31893FA5E693";
      const s =
        "0x387178AE4A51F304556C1B2E9DD24F1120D073F93017AF006AD801A639214EA6";
      const sigs: [Hex, Hex] = [
        serializeSignature({ r, s, yParity: 0 }),
        serializeSignature({ r, s, yParity: 1 }),
      ];

      await expect(offChainRecovery(recoveryData, sigs)).rejects.toThrow(
        "Invalid Path"
      );
    });
  });
});
