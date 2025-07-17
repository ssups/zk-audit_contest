# !/bin/bash

set -e

rm -rf ./target/circuit.json
rm -rf ./target/vk

echo "Compiling circuit..."
if ! nargo compile; then
    echo "Compilation failed. Exiting..."
    exit 1
fi

echo "Generating vkey..."
bb write_vk -b ./target/circuit.json -o ./target --oracle_hash keccak


echo "Generating solidity verifier..."
bb write_solidity_verifier -k ./target/vk -o ../contract/contracts/Verifier.sol

echo "Done"