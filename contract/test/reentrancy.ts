import {
  Entry,
  ReentrancyVulnerable,
  ReentrancyExploit,
} from "../typechain-types";
import { ethers } from "hardhat";

describe("example", () => {
  let entry: Entry;
  let targetContract: ReentrancyVulnerable;
  let exploitContract: ReentrancyExploit;

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

  it("verify example", async () => {
    console.log(
      entry.interface.encodeFunctionData("simulate", [
        await targetContract.getAddress(),
        await exploitContract.getAddress(),
        exploitContract.interface.encodeFunctionData("exploit", [
          await targetContract.getAddress(),
        ]),
      ])
    );

    const result = await ethers.provider.call({
      to: await entry.getAddress(),
      data: entry.interface.encodeFunctionData("simulate", [
        await targetContract.getAddress(),
        await exploitContract.getAddress(),
        exploitContract.interface.encodeFunctionData("exploit", [
          await targetContract.getAddress(),
        ]),
      ]),
      value: ethers.parseEther("10"),
    });

    console.log({
      result: entry.interface.decodeFunctionResult("simulate", result),
    });
  });
});
