import { spawn } from "node:child_process";
const port = process.env.QA_PORT || "4174";
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["tools/serve.mjs"], {
  env: { ...process.env, PORT: port },
  stdio: "ignore",
  windowsHide: true,
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(base)).ok) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for the local server. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error("QA server did not start");
  for (const file of [
    "tests/browser.cjs",
    "tests/accessibility.cjs",
    "tests/pages.cjs",
    "tests/visual.cjs",
    "tests/motion.cjs",
    "tests/threshold.cjs",
  ]) {
    const test = spawn(process.execPath, [file], {
      env: { ...process.env, BASE_URL: base },
      stdio: "inherit",
      windowsHide: true,
    });
    const code = await new Promise((resolve) => test.on("exit", resolve));
    if (code) {
      process.exitCode = code;
      break;
    }
  }
} finally {
  server.kill();
}
