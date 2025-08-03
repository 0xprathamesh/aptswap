// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Script.sol";
import "../src/CrossSwapsResolver.sol";

/**
 * @title Cross-Swaps Deployment Script
 * @dev Deploys CrossSwapsResolver contract to Sepolia
 */
contract DeployCrossSwaps is Script {
    // Sepolia testnet addresses
    address constant SEPOLIA_LIMIT_ORDER_PROTOCOL =
        0x111111125421cA6dc452d289314280a0f8842A65;
    address constant SEPOLIA_FEE_TOKEN =
        0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238; // USDC on Sepolia

    // Sepolia testnet chain ID
    uint256 constant SEPOLIA_CHAIN_ID = 11155111;

    // Test tokens on Sepolia
    address constant SEPOLIA_USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    address constant SEPOLIA_USDT = 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0;
    address constant SEPOLIA_WETH = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Deploying Cross-Swaps to Sepolia ===");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        console.log("Chain ID:", SEPOLIA_CHAIN_ID);

        vm.startBroadcast(deployerPrivateKey);

        // For now, we'll deploy a simple CrossSwapsResolver
        // Note: We'll need to deploy EscrowFactory first, but let's start with the resolver
        console.log("Deploying CrossSwapsResolver...");

        CrossSwapsResolver resolver = new CrossSwapsResolver(
            IOrderMixin(SEPOLIA_LIMIT_ORDER_PROTOCOL),
            deployer
        );

        console.log("CrossSwapsResolver deployed at:", address(resolver));

        // Configure supported chains
        console.log("Configuring supported chains...");
        resolver.setChainSupport(SEPOLIA_CHAIN_ID, true);
        resolver.setChainSupport(1, true); // Ethereum mainnet
        resolver.setChainSupport(42161, true); // Arbitrum
        resolver.setChainSupport(8453, true); // Base
        resolver.setChainSupport(137, true); // Polygon
        resolver.setChainSupport(56, true); // BSC
        resolver.setChainSupport(10, true); // Optimism

        // Configure supported tokens for Sepolia
        console.log("Configuring supported tokens for Sepolia...");
        address[] memory sepoliaTokens = new address[](3);
        bool[] memory sepoliaSupported = new bool[](3);

        sepoliaTokens[0] = SEPOLIA_USDC;
        sepoliaTokens[1] = SEPOLIA_USDT;
        sepoliaTokens[2] = SEPOLIA_WETH;

        sepoliaSupported[0] = true;
        sepoliaSupported[1] = true;
        sepoliaSupported[2] = true;

        resolver.batchSetTokenSupport(
            SEPOLIA_CHAIN_ID,
            sepoliaTokens,
            sepoliaSupported
        );

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Sepolia Testnet");
        console.log("CrossSwapsResolver:", address(resolver));
        console.log("Limit Order Protocol:", SEPOLIA_LIMIT_ORDER_PROTOCOL);
        console.log("Fee Token:", SEPOLIA_FEE_TOKEN);
        console.log("\nSupported Chains:");
        console.log("- Sepolia (11155111)");
        console.log("- Ethereum (1)");
        console.log("- Arbitrum (42161)");
        console.log("- Base (8453)");
        console.log("- Polygon (137)");
        console.log("- BSC (56)");
        console.log("- Optimism (10)");
        console.log("\nSepolia Test Tokens:");
        console.log("- USDC:", SEPOLIA_USDC);
        console.log("- USDT:", SEPOLIA_USDT);
        console.log("- WETH:", SEPOLIA_WETH);
        console.log("\nDeployment completed successfully!");
        console.log(
            "\nNext: Deploy EscrowFactory and update resolver with real factory address"
        );
    }
}
