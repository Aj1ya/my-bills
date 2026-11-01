// Tests, builds, and publishes dist/ to the gh-pages branch that GitHub Pages serves.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const run = (command, cwd = ".") => execSync(command, { cwd, stdio: "inherit" });
const read = (command) => execSync(command).toString().trim();

run("npm test");
run("npm run build");

const remote = read("git remote get-url origin");
const identity = `-c user.name="${read("git config user.name")}" -c user.email="${read("git config user.email")}"`;
writeFileSync("dist/.nojekyll", "");

// vite empties dist/ on every build, so this throwaway repo starts fresh each time.
run("git init -q -b gh-pages", "dist");
run("git add -A", "dist");
run(`git ${identity} commit -q -m "Deploy ${new Date().toISOString()}"`, "dist");
run(`git push -f "${remote}" gh-pages`, "dist");
