import { Kafka } from "kafkajs";
import { processVideo } from "./ffmpegService.js";
import { pool } from "./db.js";

const kafka = new Kafka({
  clientId: "worker-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "video-workers" });

export const startConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "video_uploaded", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      let event;
      try {
        event = JSON.parse(message.value.toString());
      } catch (err) {
        console.warn("Skipping non-JSON message:", message.value.toString());
        return; // skip it
      }

      const { videoId, filePath } = event;

      console.log("Processing video:", videoId);

      // await pool.query(
      //   "UPDATE videos SET status='processing' WHERE id=$1",
      //   [videoId]
      // );

      try {
        const outputs = await processVideo(videoId, filePath);

        // await pool.query(
        //   `UPDATE videos
        //    SET status='completed',
        //        processed_360p=$1,
        //        processed_720p=$2,
        //        thumbnail=$3
        //    WHERE id=$4`,
        //   [outputs.out360, outputs.out720, outputs.thumbnail, videoId]
        // );

        console.log("Processing completed:", videoId);
      } catch (err) {
        console.error("Processing failed:", err);

        // await pool.query(
        //   "UPDATE videos SET status='failed' WHERE id=$1",
        //   [videoId]
        // );
      }
    },
  });
};