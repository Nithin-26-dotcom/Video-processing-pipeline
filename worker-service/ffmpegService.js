import { exec } from "child_process";
import fs from "fs";
import path from "path";
import axios from "axios";
import cloudinary from "./cloudinary.js";

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

export const processVideo = async (videoId, public_id) => {
  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const inputPath = path.join(tmpDir, `raw_${videoId}.mp4`);
  const out360 = path.join(tmpDir, `360p_${videoId}.mp4`);
  const out720 = path.join(tmpDir, `720p_${videoId}.mp4`);
  const thumbnail = path.join(tmpDir, `thumb_${videoId}.jpg`);

  try {
    // 1. Get Video URL
    console.log(`Fetching Cloudinary resource: ${public_id}`);
    const resource = await cloudinary.api.resource(public_id, {
      resource_type: "video"
    });
    const videoUrl = resource.secure_url;

    // 2. Download Video
    console.log(`Downloading ${videoUrl} to ${inputPath}`);
    const response = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "stream"
    });

    const writer = fs.createWriteStream(inputPath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // 3. Transcode with FFmpeg
    console.log("Transcoding...");
    await run(`ffmpeg -i "${inputPath}" -vf scale=640:360 "${out360}"`);
    await run(`ffmpeg -i "${inputPath}" -vf scale=1280:720 "${out720}"`);
    await run(`ffmpeg -i "${inputPath}" -ss 00:00:02 -vframes 1 "${thumbnail}"`);

    // 4. Parallel Uploads back to Cloudinary
    console.log("Uploading processed files to Cloudinary...");
    const [res360, res720, resThumb] = await Promise.all([
      cloudinary.uploader.upload_large(out360, {
        resource_type: "video",
        public_id: `processed/${videoId}/360p`
      }),
      cloudinary.uploader.upload_large(out720, {
        resource_type: "video",
        public_id: `processed/${videoId}/720p`
      }),
      cloudinary.uploader.upload(thumbnail, {
        resource_type: "image",
        public_id: `processed/${videoId}/thumbnail`
      })
    ]);

    console.log("Uploads complete!");
    return {
      out360Url: res360.secure_url,
      out720Url: res720.secure_url,
      thumbnailUrl: resThumb.secure_url,
    };
  } finally {
    // 5. Cleanup
    console.log("Cleaning up temp files...");
    const filesToClean = [inputPath, out360, out720, thumbnail];
    for (const file of filesToClean) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
  }
};