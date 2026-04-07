import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { Kafka } from "kafkajs";
import cloudinary from "../cloudinary.js";

const router = express.Router();

// Kafka producer setup
const kafka = new Kafka({
  clientId: "upload-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const producer = kafka.producer();

// Temp Multer storage
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("video"), async (req, res) => {
  try {
    const videoId = uuidv4();
    const public_id = `raw/${videoId}`;

    console.log("Uploading to Cloudinary...");
    await cloudinary.uploader.upload_large(req.file.path, {
      resource_type: "video",
      public_id: public_id,
    });

    console.log("Upload complete, cleaning temp file...");
    fs.unlinkSync(req.file.path);

    const event = {
      videoId: videoId,
      public_id: public_id,
      uploadedAt: new Date().toISOString(),
    };

    // Ensure producer is connected before sending (KafkaJS connect is idempotent)
    await producer.connect();

    await producer.send({
      topic: "video_uploaded",
      messages: [
        {
          key: videoId,
          value: JSON.stringify(event),
        },
      ],
    });

    console.log("Kafka event published:", event);

    res.json({
      message: "Upload successful",
      videoId: videoId,
      public_id: public_id,
    });
  } catch (err) {
    console.error("Failed to process upload:", err);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;