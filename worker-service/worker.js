import { startConsumer } from "./kafkaConsumer.js";

console.log("Worker service starting...");

startConsumer().catch(console.error);