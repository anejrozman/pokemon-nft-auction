#!/bin/bash

# This script installs Foundry and sets up the project for testing

# Install Foundry
echo "Installing Foundry..."
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
source ~/.zshrc 2>/dev/null || true  # In case using zsh
foundryup

# Install dependencies (from the project root)
echo "Installing dependencies..."
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts@v5.0.0 --no-commit

echo "Setup complete! You can now run forge tests."
echo "Example: forge test --match-path test/marketplace/**/*.t.sol -vvv" 