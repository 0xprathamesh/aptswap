// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Script.sol";
import "../src/EscrowFactory.sol";
import "../src/CrossSwapsResolver.sol";

/**
 * @title EscrowFactory Deployment Script
 * @dev Deploys EscrowFactory for real cross-chain atomic swaps
 */
contract DeployEscrowFactory is Script {
    // Sepolia testnet addresses
    address constant SEPOLIA_LIMIT_ORDER_PROTOCOL =
        0x111111125421cA6dc452d289314280a0f8842A65;
    address constant SEPOLIA_FEE_TOKEN =
        0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238; // USDC on Sepolia
    address constant SEPOLIA_ACCESS_TOKEN =
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

        console.log("=== Deploying EscrowFactory to Sepolia ===");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        console.log("Chain ID:", SEPOLIA_CHAIN_ID);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy EscrowFactory
        console.log("Deploying EscrowFactory...");
        EscrowFactory factory = new EscrowFactory(
            SEPOLIA_LIMIT_ORDER_PROTOCOL,
            IERC20(SEPOLIA_FEE_TOKEN),
            IERC20(SEPOLIA_ACCESS_TOKEN),
            deployer,
            3600, // rescueDelaySrc: 1 hour
            3600 // rescueDelayDst: 1 hour
        );
        console.log("EscrowFactory deployed at:", address(factory));

        // Update CrossSwapsResolver with real factory address
        console.log("Updating CrossSwapsResolver with factory address...");
        address payable resolverAddress = payable(
            vm.envAddress("CROSS_SWAPS_RESOLVER_ADDRESS")
        );
        CrossSwapsResolver resolver = CrossSwapsResolver(resolverAddress);

        // Note: We'll need to update the resolver to use the real factory
        // For now, we'll just log the addresses
        console.log("CrossSwapsResolver address:", resolverAddress);
        console.log("EscrowFactory address:", address(factory));

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Sepolia Testnet");
        console.log("EscrowFactory:", address(factory));
        console.log("CrossSwapsResolver:", resolverAddress);
        console.log("Limit Order Protocol:", SEPOLIA_LIMIT_ORDER_PROTOCOL);
        console.log("Fee Token:", SEPOLIA_FEE_TOKEN);
        console.log("Access Token:", SEPOLIA_ACCESS_TOKEN);
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
        console.log("\nNext: Update API configuration with factory address");
    }
}
