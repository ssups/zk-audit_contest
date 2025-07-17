import { ethers } from "hardhat";
import {
  Entry,
  ReentrancyExploit,
  ReentrancyVulnerable,
} from "../typechain-types";
import { ForeignCallInput, ForeignCallOutput, Noir } from "@noir-lang/noir_js";
import circuit from "../../circuit/target/circuit.json";
import { UltraHonkBackend } from "@aztec/bb.js";

describe("example", () => {
  let entry: Entry;
  let targetContract: ReentrancyVulnerable;
  let exploitContract: ReentrancyExploit;
  const noir = new Noir(circuit as any);
  const honk = new UltraHonkBackend(circuit.bytecode, { threads: 5 });

  before(async () => {
    entry = await (await ethers.getContractFactory("Entry")).deploy();
    await entry.deploymentTransaction()?.wait();
    targetContract = await (
      await ethers.getContractFactory("ReentrancyVulnerable")
    ).deploy();
    await targetContract.deploymentTransaction()?.wait();
    exploitContract = await (
      await ethers.getContractFactory("ReentrancyExploit")
    ).deploy();
    await exploitContract.deploymentTransaction()?.wait();

    await ethers.provider.send("hardhat_setBalance", [
      await targetContract.getAddress(),
      "0x" + ethers.parseEther("100").toString(16),
    ]);
  });

  it("With correct oracle", async () => {
    const oracleHandler = async (
      name: string,
      input: ForeignCallInput[]
    ): Promise<ForeignCallOutput[]> => {
      if (name !== "getVerify") {
        throw new Error(`Unknown oracle function: ${name}`);
      }
      await noir.init();

      let [[exploitContractAddr], [targetContractAddr], [value]] = input;
      exploitContractAddr = ethers.getAddress(
        exploitContractAddr.toString().slice(66 - 40)
      );
      targetContractAddr = ethers.getAddress(
        targetContractAddr.toString().slice(66 - 40)
      );

      const result = await ethers.provider.call({
        to: await entry.getAddress(),
        data: entry.interface.encodeFunctionData("simulate", [
          targetContractAddr,
          exploitContractAddr,
          exploitContract.interface.encodeFunctionData("exploit", [
            targetContractAddr,
          ]),
        ]),
        value: BigInt(value),
      });
      return [result];
    };

    const { witness } = await noir.execute(
      {
        exploit_contract: await exploitContract.getAddress(),
        target_contract: await targetContract.getAddress(),
        value: "0x" + ethers.parseEther("10").toString(16),
      },
      oracleHandler
    );
    const proofData = await honk.generateProof(witness, {
      keccak: true,
    });
    const verified = await honk.verifyProof(proofData, { keccak: true });
    console.log("Proof verified:", verified);
  });

  it("With malicious oracle", async () => {
    const oracleHandler = async () => {
      return ["0x01"];
    };

    const { witness } = await noir.execute(
      {
        exploit_contract: await exploitContract.getAddress(),
        target_contract: await targetContract.getAddress(),
        value: "0x" + ethers.parseEther("10").toString(16),
      },
      oracleHandler
    );
    const proofData = await honk.generateProof(witness, {
      keccak: true,
    });
    const verified = await honk.verifyProof(proofData, { keccak: true });
    console.log("Proof verified:", verified);
  });
});
