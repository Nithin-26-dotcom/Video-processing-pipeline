import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Kafka } from "kafkajs";

const router = express.Router();

// Resolve absolute path relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storagePath =
  process.env.STORAGE_PATH ||
  path.resolve(__dirname, "../../storage/raw");

// Ensure folder exists
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

// Kafka producer setup
const kafka = new Kafka({
  clientId: "upload-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  console.log("Kafka producer connected");
};

connectProducer().catch(console.error);

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storagePath);
  },
  filename: (req, file, cb) => {
    const videoId = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${videoId}${ext}`;
    req.videoId = videoId;
    req.videoFilename = filename;
    cb(null, filename);
  },
});

console.log("Saving to:", storagePath);

const upload = multer({ storage });

router.post("/", upload.single("video"), async (req, res) => {
  try {
    const event = {
      videoId: req.videoId,
      filePath: path.join(storagePath, req.videoFilename),  // ✅ real absolute path,
      uploadedAt: new Date().toISOString(),
    };

    await producer.send({
      topic: "video_uploaded",
      messages: [
        {
          key: req.videoId,         // keyed by videoId for partition ordering
          value: JSON.stringify(event),
        },
      ],
    });

    console.log("Kafka event published:", event);

    res.json({
      message: "Upload successful",
      videoId: req.videoId,
      file: req.file.filename,
    });
  } catch (err) {
    console.error("Failed to publish Kafka event:", err);
    res.status(500).json({ error: "Upload succeeded but failed to queue for processing" });
  }
});

export default router;