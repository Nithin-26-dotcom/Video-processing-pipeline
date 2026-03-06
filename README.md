# Distributed Video Processing Pipeline (YouTube Style)

This project implements an event-driven, microservices-based architecture for processing user-uploaded videos asynchronously. Instead of making the user wait for their video to be transcoded and stored, the pipeline offloads the heavy processing to background workers via Apache Kafka.

## 🎯 Architecture & Workflow

1. **Upload Service:** A lightweight Express.js API that accepts raw video files `(.mp4, .mov, etc.)` via `multer` from the user-facing web client. 
2. **Event Queue (Apache Kafka):** Upon a successful upload, a Kafka Producer immediately publishes a `video_uploaded` event to the message broker.
3. **Storage (Docker Volumes):** Raw videos are saved to a shared, persistent Docker volume (`./storage/raw`).
4. **Worker Service:** A consumer application running built-in OS-level `ffmpeg` binds to Kafka. It receives the new file path, heavily transcodes the video into `360p` and `720p` variations, and slices a `.jpg` thumbnail.
5. **Database (PostgreSQL):** Tracking video metadata and processing state securely.

---

## 🛠️ Technology Stack

- **Node.js & Express.js** (API and Worker code)
- **Apache Kafka (KRaft)** (Event-driven message brokering, no Zookeeper)
- **FFmpeg** (CLI engine mapping to `child_process` for video encoding)
- **PostgreSQL** (Relational Database)
- **Docker & Docker Compose** (Containerization and orchestration)

---

## 🚀 Getting Started (Docker Compose)

The easiest and only supported way to run this entire microservices architecture is through Docker Compose. We have perfectly wired up the internal DNS, network bindings, and volume mappings for you.

### Prerequisites
- [Docker Engine & Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your machine.
- Git.

### 1. Clone the Repository
```bash
git clone https://github.com/Nithin-26-dotcom/Video-processing-pipeline.git
cd Video-processing-pipeline
```

### 2. Build and Spin Up the Infrastructure
Run the following single command from the root of the project. Docker will automatically pull the Kafka/Postgres images, build the Node.js containers (installing `ffmpeg` into the worker OS), and start everything on an isolated network.

```bash
docker-compose up -d --build
```
> Note: `--build` is only strictly necessary on the first run or when you modify the Node.js code/configuration.

### 3. Verify Services are Running
To check that Kafka, Postgres, the Upload Service (Port 3000), and the Worker Service are all actively running without crashes:
```bash
docker-compose ps
```

### 4. Try it Out!
1. Open your browser and go to the frontend client at: 
   👉 **`http://localhost:3000`**
2. Choose a `.mp4` file from your device and click **Upload**.
3. You will immediately get an `Upload successful` JSON response confirming the system received the Kafka event.

### 5. Watch the Magic Happen
The moment you see "upload successful", your local `worker-service` container will start churning the video in the background.

To watch the live logs of FFmpeg extracting the thumbnails and compressing to 360p/720p:
```bash
docker-compose logs -f worker-service
```

### 6. View the Final Results
This setup uses Docker Volumes explicitly mapped to your host machine so you can easily access the outputs.
Navigate to your project folder locally:
- **`./storage/raw`:** This holds the original uploaded video.
- **`./storage/processed/<uuid>`:** This will contain the generated `360p.mp4`, `720p.mp4`, and `thumbnail.jpg`!

---

## 🧹 Stopping and Cleaning Up

To gracefully stop all containers without destroying your generated data:
```bash
docker-compose down
```

If you ever wish to completely wipe the PostgreSQL database, Kafka events, and Docker networks to start fresh:
```bash
docker-compose down -v
```
