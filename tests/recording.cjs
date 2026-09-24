// Developer-only recording via Chromium's screencast and native WebM encoder.
// Avoids an external FFmpeg binary; never imported by production.
const fs = require("node:fs/promises");
exports.record = async (browser, page) => {
  const encoder = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await encoder.setContent('<canvas width="390" height="844"></canvas>');
  await encoder.evaluate(() => {
    const canvas = document.querySelector("canvas");
    window.stream = canvas.captureStream(0);
    window.chunks = [];
    window.recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8",
      videoBitsPerSecond: 1800000,
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    window.encodeFrame = async (data) => {
      const img = new Image();
      img.src = "data:image/jpeg;base64," + data;
      await img.decode();
      canvas.getContext("2d").drawImage(img, 0, 0, 390, 844);
      stream.getVideoTracks()[0].requestFrame();
    };
    recorder.start();
  });
  await page.bringToFront();
  const cdp = await page.context().newCDPSession(page);
  let pending = null,
    frames = 0,
    failure = null;
  cdp.on("Page.screencastFrame", (event) => {
    cdp
      .send("Page.screencastFrameAck", { sessionId: event.sessionId })
      .catch(() => {});
    if (pending) return;
    frames++;
    pending = encoder
      .evaluate((data) => encodeFrame(data), event.data)
      .catch((error) => {
        // Teardown after a failed assertion must not mask that assertion with
        // an unhandled encoder rejection. A normal stop still reports errors.
        failure = error;
      })
      .finally(() => {
        pending = null;
      });
  });
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 82,
    maxWidth: 390,
    maxHeight: 844,
    everyNthFrame: 1,
  });
  return async (path) => {
    await cdp.send("Page.stopScreencast");
    await pending;
    if (failure) throw failure;
    const finalFrame = await cdp.send("Page.captureScreenshot", {
      format: "jpeg",
      quality: 82,
    });
    await encoder.evaluate((data) => encodeFrame(data), finalFrame.data);
    await page.waitForTimeout(250);
    const encoded = await encoder.evaluate(
      () =>
        new Promise((resolve) => {
          recorder.onstop = () => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.readAsDataURL(new Blob(chunks, { type: "video/webm" }));
            stream.getTracks().forEach((t) => t.stop());
          };
          recorder.stop();
        }),
    );
    await fs.writeFile(path, Buffer.from(encoded, "base64"));
    await cdp.detach();
    await encoder.close();
    return { frames, bytes: Buffer.byteLength(encoded, "base64") };
  };
};
