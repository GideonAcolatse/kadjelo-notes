# Kadjelo Notes — Capture at the Speed of Thought

[![Live App](https://img.shields.io/badge/Vercel-Live%20App-black?logo=vercel)](https://kadjelo-notes.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/GideonAcolatse/kadjelo-notes)

- **Production App**: [https://kadjelo-notes.vercel.app](https://kadjelo-notes.vercel.app)
- **GitHub Repository**: [https://github.com/GideonAcolatse/kadjelo-notes](https://github.com/GideonAcolatse/kadjelo-notes)

**Kadjelo Notes** is an installable, offline-first **Progressive Web App (PWA)** and **Second-Brain Workspace** engineered with **React 18 (Vite)**, **Node.js / Express**, **Neon Serverless PostgreSQL**, and **Vercel**, built on the **Apple Design (`apple-design`)** and **iOS 26 Liquid Glass** design system.

---

## Core Architecture & Features

- **Installable Mobile & Desktop PWA**: Standalone home-screen installation (`manifest.webmanifest`), offline Service Worker caching (`sw.js`), mobile thumb-zone Liquid Glass bottom tab bar, and 1:1 horizontal card swipe gestures (swipe right to Pin, swipe left to Trash).
- **4 Workspace Views**:
  1. **Bento Card Grid** (Visual card wall with Pinned section & tint filters)
  2. **Split-Pane Focus Editor** (Apple Notes / Bear master-detail layout)
  3. **Kanban Workflow Board** (*To Do → In Progress → Completed*)
  4. **Second-Brain Knowledge Graph** (Interactive force-directed canvas visualizing `[[Wiki-Links]]` and categories)
- **Multi-Theme Liquid Glass Engine**: Live switching across 4 signature themes (*Obsidian & Indigo Glass*, *Emerald & Slate Studio*, *Amber & Warm Titanium*, *Cyber Rose & Midnight*) in both **Dark Mode** and **Light Mode**.
- **Multi-Modal Capture**:
  - **Markdown Editor** with Write / Preview / Split tabs and clickable `[[Wiki-Links]]`
  - **Interactive Checklists** with live completion progress bars
  - **Finger & Stylus Sketch Pad** (HTML5 Pointer Events canvas drawing)
  - **Voice Memo Audio Recorder** (`MediaRecorder` API) & **Live Speech-to-Text Dictation** (`SpeechRecognition` API)
  - **Camera Photo Attachments**
- **Privacy Vault**: Lock sensitive notes behind a **4-to-8 digit PIN** (SHA-256) and/or **WebAuthn Biometrics** (FaceID / TouchID / Fingerprint).
- **Study & Focus Suite**: Auto-generated **3D Study Flashcard Deck** (`Term :: Definition` syntax) and a built-in **Pomodoro Focus Timer** logging focus minutes per note.
- **Ambient AI Assistant**: Extractive TL;DR Summarizer, Checklist Action Item Extractor, Auto-Categorizer & Tagger (works 100% offline with optional Google Gemini API key support).
- **Share & Export Suite**: High-DPI branded **Kadjelo Notes Social Card (PNG)** generator, Native Phone Share Sheet (`navigator.share`), Print-Ready **PDF**, **Markdown (`.md`)**, and **JSON Backup**.

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd C:\Projects\kadjelo-notes
npm run install:all
```

### 2. Configure Environment Variables (Optional for Local-First, Required for Neon Cloud Sync)
Copy `.env.example` to `.env` in the root folder and add your **Neon Serverless PostgreSQL** connection string:
```env
DATABASE_URL="postgresql://user:password@ep-your-instance.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-production-jwt-secret"
PORT=5000
```
*(Note: The database tables `users` and `notes` are created automatically on first connection! Even before `DATABASE_URL` is added, the app runs 100% smoothly in Local-First Offline Mode.)*

### 3. Run Frontend & Backend
```bash
# Terminal 1 — Start Express + Neon API Server (http://localhost:5000)
npm run dev:server

# Terminal 2 — Start React + Vite PWA Client (http://localhost:5173)
npm run dev:client
```

---

## Deploying to Vercel + Neon DB

1. Push `C:\Projects\kadjelo-notes` to a GitHub repository.
2. Import the repository into **Vercel**.
3. In Vercel **Project Settings → Environment Variables**, add:
   - `DATABASE_URL` (your Neon PostgreSQL connection string)
   - `JWT_SECRET` (any strong secret string)
4. Click **Deploy** — `vercel.json` automatically builds the React PWA from `client/dist` and mounts the Express API via `api/index.js` as a Vercel Serverless Function!
