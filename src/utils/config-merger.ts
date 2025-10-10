import { promises as fs } from "fs";
import { join } from "path";

export async function mergeMcpConfig(
  configPath: string,
  newConfig: Record<string, any>
): Promise<void> {
  let existingConfig = {};

  try {
    const content = await fs.readFile(configPath, "utf-8");
    existingConfig = JSON.parse(content);
  } catch (error) {
    // File doesn't exist or is invalid JSON, start with empty config
    existingConfig = {};
  }

  // Deep merge the configurations
  const mergedConfig = deepMerge(existingConfig, newConfig);

  await fs.writeFile(
    configPath,
    JSON.stringify(mergedConfig, null, 2) + "\n",
    "utf-8"
  );
}

function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}
