import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const processedBase = process.env.PROCESSED_PATH || 
  path.resolve(__dirname, "../../storage/processed");

export const processVideo = async (videoId, inputPath) => {
  const outputDir = path.join(processedBase, videoId);

  console.log("processedBase:", processedBase);
  console.log("outputDir:", outputDir);
  console.log("inputPath:", inputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const out360 = path.join(outputDir, "360p.mp4");
  const out720 = path.join(outputDir, "720p.mp4");
  const thumbnail = path.join(outputDir, "thumbnail.jpg");

  const run = (cmd) =>
    new Promise((resolve, reject) => {
      console.log("Running:", cmd);
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          console.error("stderr:", stderr);
          reject(err);
        } else resolve();
      });
    });

  await run(`ffmpeg -i "${inputPath}" -vf scale=640:360 "${out360}"`);
  await run(`ffmpeg -i "${inputPath}" -vf scale=1280:720 "${out720}"`);
  await run(`ffmpeg -i "${inputPath}" -ss 00:00:02 -vframes 1 "${thumbnail}"`);

  return { out360, out720, thumbnail };
};