import fs from "fs";
import path from "path";

const REQUIRED_DESIGNS = [
  "never-alone",
  "street-duck",
  "coffee-energy",
  "slow-pace",
  "human-evolution",
  "the-climb",
  "justice",
];

const REQUIRED_VARIANTS = ["print-dark-shirt.png", "print-light-shirt.png"];

export function verifyLaunchAssets(): { success: boolean; missing: string[] } {
  const baseDir = path.join(process.cwd(), "public", "assets", "designs");
  const missing: string[] = [];

  for (const slug of REQUIRED_DESIGNS) {
    for (const variant of REQUIRED_VARIANTS) {
      const filePath = path.join(baseDir, slug, "master", variant);
      if (!fs.existsSync(filePath)) {
        missing.push(`${slug}/master/${variant} (File not found)`);
      } else {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          missing.push(`${slug}/master/${variant} (File is 0 bytes)`);
        }
      }
    }
  }

  return {
    success: missing.length === 0,
    missing,
  };
}

if (require.main === module) {
  console.log("🔍 Running Launch Asset Preflight Verification...");
  const result = verifyLaunchAssets();

  if (result.success) {
    console.log("✅ Preflight Passed: All 14 official launch artwork files exist and are valid.");
    process.exit(0);
  } else {
    console.error("❌ Preflight Failed: Missing or invalid launch artwork files:");
    result.missing.forEach((item) => console.error(`   - ${item}`));
    process.exit(1);
  }
}
