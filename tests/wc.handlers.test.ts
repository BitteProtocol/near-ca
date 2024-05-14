import { TransactionSerializable, toHex } from "viem";
import {
  EthTransactionParams,
  PersonalSignParams,
  wcRouter,
} from "../src/wallet-connect/handlers";

describe("Wallet Connect", () => {
  const chainId = "eip155:11155111";

  it("wcRouter: personal_sign", async () => {
    const messageString = "Hello!";
    const request = {
      method: "personal_sign",
      params: [
        toHex(messageString),
        "0xa61d98854f7ab25402e3d12548a2e93a080c1f97",
      ],
    };

    const { evmMessage, payload } = await wcRouter(
      request.method,
      chainId,
      request.params as PersonalSignParams
    );
    expect(evmMessage).toEqual(messageString);
    expect(payload).toEqual([
      129, 83, 250, 146, 102, 140, 185, 9, 243, 111, 112, 21, 11, 157, 12, 23,
      202, 85, 99, 164, 77, 162, 209, 137, 199, 133, 194, 59, 178, 150, 153, 78,
    ]);
  });
  it("wcRouter: sendTransaction (with value)", async () => {
    const request = {
      method: "eth_sendTransaction",
      params: [
        {
          gas: "0xd31d",
          value: "0x16345785d8a0000",
          from: "0xa61d98854f7ab25402e3d12548a2e93a080c1f97",
          to: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
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
      account: "0xa61d98854f7ab25402e3d12548a2e93a080c1f97",
      chainId: 11155111,
      data: "0xd0e30db0",
      gas: 54045n,
      to: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
      value: 100000000000000000n,
    });
    /// can't test payload: its non-deterministic because of gas values!
  });

  it("wcRouter: sendTransaction (null value)", async () => {
    const request = {
      method: "eth_sendTransaction",
      params: [
        {
          gas: "0xa8c3",
          from: "0xa61d98854f7ab25402e3d12548a2e93a080c1f97",
          to: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
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
      account: "0xa61d98854f7ab25402e3d12548a2e93a080c1f97",
      chainId: 11155111,
      data: "0x2e1a7d4d000000000000000000000000000000000000000000000000002386f26fc10000",
      gas: 43203n,
      to: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
      value: 0n,
    });
    /// can't test payload: its non-deterministic because of gas values!
  });
  it("wcRouter: eth_signTypedData", async () => {
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
      params: ["0xa61d98854f7ab25402e3d12548a2e93a080c1f97", jsonStr],
    };

    const { evmMessage, payload } = await wcRouter(
      request.method,
      chainId,
      request.params as PersonalSignParams
    );
    expect(evmMessage).toEqual(request.params[1]);
    expect(payload).toEqual([
      154, 201, 197, 176, 122, 212, 161, 42, 56, 12, 218, 93, 39, 197, 249, 144,
      53, 126, 250, 19, 85, 168, 82, 131, 104, 184, 46, 112, 237, 228, 48, 12,
    ]);
  });
});
