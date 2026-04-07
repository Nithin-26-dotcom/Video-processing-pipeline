# 🎥 Distributed Video Processing Pipeline (Cloud-Native, Event-Driven)

This project implements a **YouTube-style video processing pipeline** using a microservices architecture. It demonstrates how large video files can be processed asynchronously using event-driven design, without blocking user requests.

---

## 🚀 Architecture Overview

```text
Client
  ↓
Upload Service (Express + Multer)
  ↓ (upload_large)
Cloud Storage (Cloudinary)
  ↓ (event: public_id)
Apache Kafka
  ↓
Worker Service (FFmpeg)
  ↓
Cloudinary (processed outputs)
```

---

## ⚙️ Workflow

1. **Upload Service**

   * Accepts video via API (`POST /upload`)
   * Uploads raw video to Cloudinary using `upload_large`
   * Generates a unique `public_id` (`raw/<videoId>`)
   * Publishes event to Kafka topic `video_uploaded`

2. **Event Queue – Apache Kafka**

   * Decouples upload and processing
   * Enables asynchronous, scalable processing
   * Ensures reliable message delivery

3. **Worker Service**

   * Consumes Kafka events
   * Downloads video from Cloudinary CDN
   * Uses **FFmpeg** to:

     * Generate `360p` video
     * Generate `720p` video
     * Extract thumbnail
   * Uploads processed outputs back to Cloudinary:

     ```
     processed/<videoId>/360p
     processed/<videoId>/720p
     processed/<videoId>/thumbnail
     ```

4. **Storage Layer (Cloud-Based)**

   * Raw and processed videos are stored in Cloudinary
   * Accessible via secure CDN URLs

5. **Database (Planned) – PostgreSQL**

   * Included for tracking processing status
   * Integration is scaffolded but not yet active 

---

## 🛠️ Tech Stack

* **Node.js & Express.js** – API and worker services
* **Apache Kafka (KRaft)** – Event streaming
* **FFmpeg** – Video transcoding
* **Cloudinary** – Cloud storage + CDN delivery
* **PostgreSQL** – Metadata storage (planned)
* **Docker & Docker Compose** – Containerization and orchestration

---

## 🧠 Key Design Principles

* **Asynchronous Processing**
  Upload returns instantly; processing happens in background

* **Event-Driven Architecture**
  Kafka decouples services and enables scalability

* **Stateless Workers**
  Workers download from cloud storage instead of shared disk

* **Cloud-Native Storage**
  Eliminates dependency on local volumes

* **Horizontal Scalability**
  Multiple workers can process videos in parallel

---

## ⚡ Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/Nithin-26-dotcom/Video-processing-pipeline.git
cd Video-processing-pipeline
```

---

### 2. Configure Environment Variables

Create a `.env` file in the root:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

### 3. Run with Docker

```bash
docker-compose up -d --build
```

---

### 4. Access Application

👉 Open:

```
http://localhost:3000
```

Upload a video file.

---

### 5. Monitor Processing

```bash
docker-compose logs -f worker-service
```

You will see:

* Download from Cloudinary
* FFmpeg transcoding
* Upload of processed files

---

## 📦 Output

Processed assets are available via Cloudinary URLs:

* `360p video`
* `720p video`
* `thumbnail`

Example structure:

```text
processed/<videoId>/360p
processed/<videoId>/720p
processed/<videoId>/thumbnail
```

---

## 🧩 Current Limitations

* PostgreSQL integration is scaffolded but not active
* No API to query processing status
* No retry/DLQ mechanism for failed jobs

---

## 🚀 Future Improvements

* ✅ Enable PostgreSQL for status tracking
* 🔄 Add `/video/:id/status` API
* ⚡ Implement retry + dead-letter queue
* 🎥 Support HLS/DASH streaming
* 📈 Add monitoring & metrics

---

## 🏁 Summary

This project demonstrates how real-world platforms like
YouTube and Netflix handle large-scale video processing using:

* Event-driven systems
* Distributed workers
* Cloud storage + CDN

---

## ⭐ Key Takeaway

> Upload fast. Process asynchronously. Scale infinitely.

---
