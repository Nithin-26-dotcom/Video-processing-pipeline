import express from "express";
import cors from "cors";
import uploadRoute from "./routes/upload.js";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/upload", uploadRoute);

app.use(express.static("public"));

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Upload service running on port ${PORT}`);
});