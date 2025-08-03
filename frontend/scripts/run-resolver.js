#!/usr/bin/env node

// Simple script to run the resolver
// Usage: node run-resolver.js <swapId> <secret> <aptosAmount>

const { runResolver } = require("./resolver.ts");

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log("Usage: node run-resolver.js <swapId> <secret> <aptosAmount>");
    console.log("");
    console.log("Example:");
    console.log(
      "node run-resolver.js swap_1753635243715_ubdvoy42s 0x29261ad86f7db747b0e711a4af706ba86aa07a1b2ae0734fe880680843b1b59a 1579988"
    );
    process.exit(1);
  }

  const [swapId, secret, aptosAmount] = args;

  console.log("🚀 Starting Resolver Script");
  console.log("========================");
  console.log(`Swap ID: ${swapId}`);
  console.log(`Secret: ${secret}`);
  console.log(`APTOS Amount: ${aptosAmount} octas`);
  console.log("========================\n");

  try {
    await runResolver(swapId, secret, parseInt(aptosAmount));
  } catch (error) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  }
}

main();
