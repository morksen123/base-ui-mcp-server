import { execa } from "execa";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export async function detectPackageManager(
  cwd: string = process.cwd()
): Promise<PackageManager> {
  const lockFiles = [
    { file: "bun.lockb", manager: "bun" as PackageManager },
    { file: "pnpm-lock.yaml", manager: "pnpm" as PackageManager },
    { file: "yarn.lock", manager: "yarn" as PackageManager },
    { file: "package-lock.json", manager: "npm" as PackageManager },
  ];

  for (const { file, manager } of lockFiles) {
    try {
      await import("fs/promises").then((fs) => fs.access(`${cwd}/${file}`));
      return manager;
    } catch {
      // File doesn't exist, continue checking
    }
  }

  // Check for packageManager field in package.json
  try {
    const packageJson = await import("fs/promises").then((fs) =>
      fs.readFile(`${cwd}/package.json`, "utf-8").then(JSON.parse)
    );
    if (packageJson.packageManager) {
      const manager = packageJson.packageManager.split("@")[0];
      if (["npm", "pnpm", "yarn", "bun"].includes(manager)) {
        return manager as PackageManager;
      }
    }
  } catch {
    // package.json doesn't exist or doesn't have packageManager field
  }

  return "npm";
}

export async function installPackage(
  packageName: string,
  cwd: string = process.cwd(),
  dev: boolean = true
): Promise<void> {
  const packageManager = await detectPackageManager(cwd);

  // Check if we're in a workspace (pnpm workspace file exists)
  const isWorkspace = await checkIfWorkspace(cwd);

  // For local development, don't try to install the package if it's the current package
  const packageJsonPath = `${cwd}/package.json`;
  try {
    const packageJson = await import("fs/promises").then((fs) =>
      fs.readFile(packageJsonPath, "utf-8").then(JSON.parse)
    );

    // If we're trying to install the same package we're in, skip installation
    if (packageJson.name === packageName) {
      console.log(`📦 Skipping installation of ${packageName} (local package)`);
      return;
    }
  } catch {
    // package.json doesn't exist, continue with installation
  }

  // In pnpm workspaces, don't try to install as dev dependency to workspace root
  if (isWorkspace && packageManager === "pnpm") {
    console.log(`📦 Skipping package installation (pnpm workspace detected)`);
    return;
  }

  const installArgs = getInstallArgs(packageManager, dev);
  installArgs.push(packageName);

  await execa(packageManager, installArgs, {
    cwd,
    stdio: "inherit",
  });
}

async function checkIfWorkspace(cwd: string): Promise<boolean> {
  try {
    await import("fs/promises").then((fs) =>
      fs.access(`${cwd}/pnpm-workspace.yaml`)
    );
    return true;
  } catch {
    return false;
  }
}

function getInstallArgs(
  packageManager: PackageManager,
  dev: boolean
): string[] {
  switch (packageManager) {
    case "npm":
      return dev ? ["install", "--save-dev"] : ["install"];
    case "pnpm":
      return dev ? ["add", "-D"] : ["add"];
    case "yarn":
      return dev ? ["add", "-D"] : ["add"];
    case "bun":
      return dev ? ["add", "-d"] : ["add"];
    default:
      return dev ? ["install", "--save-dev"] : ["install"];
  }
}
