# MeetingLens

> AI-powered meeting intelligence platform that transforms meeting recordings into searchable knowledge.

MeetingLens automatically processes meeting recordings, generates structured summaries, extracts action items and decisions, identifies speakers, and provides an AI chatbot to query any meeting.

The project is being built as a **production-grade AI SaaS**, focusing on scalable architecture, clean code, background processing, and provider abstraction rather than a simple demo application.

---

# Vision

Meetings contain valuable information that is usually forgotten after they end.

MeetingLens converts every meeting into an intelligent knowledge base by:

- Recording meetings
- Processing audio
- Generating transcripts
- Mapping speakers
- Extracting action items
- Extracting decisions
- Generating summaries
- Allowing users to chat with previous meetings

---

# Features

## Core Features

- User Authentication
- Meeting Management
- Meeting Recording
- Background Processing
- AI Generated Summaries
- Action Items
- Decision Extraction
- Speaker Mapping
- AI Chat
- Semantic Search
- Meeting Timeline
- Upload Progress
- Retry Failed Jobs

---

## AI Features

- Speech-to-Text
- Speaker Diarization
- Meeting Summaries
- Action Item Extraction
- Decision Detection
- Retrieval Augmented Generation (RAG)
- Contextual AI Chat
- Embedding Search

---

## Future Features

- Google Calendar Integration
- Outlook Integration
- Zoom Integration
- Google Meet Integration
- Slack Notifications
- Email Reports
- Team Workspaces
- Analytics Dashboard
- Meeting Insights
- Mobile Application

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- TanStack Query
- React Router

---

## Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- BullMQ
- Redis

---

## AI

- Google Gemini
- OpenRouter
- Faster Whisper
- Pyannote
- pgvector

Provider architecture allows changing models without changing business logic.

---

## Infrastructure

- Turborepo
- Docker
- Docker Compose
- GitHub Actions
- S3 Compatible Storage

---

# High Level Architecture

```text
Chrome Extension
        │
        ▼
   Express API
        │
        ▼
     BullMQ Queue
        │
        ▼
   Background Workers
        │
        ▼
AI Providers + Storage
        │
        ▼
 PostgreSQL + Object Storage
```

---

# Project Structure

```
meetinglens/

apps/
    api/
    web/
    workers/
    extension/

packages/
    ai-sdk/
    config/
    db/
    logger/
    queue/
    storage/
    types/
    utils/

docker/

docs/

scripts/
```

---

# Design Principles

MeetingLens follows several engineering principles.

- Domain-first architecture
- Thin controllers
- Service layer
- Repository pattern
- Provider pattern
- Factory pattern
- Event-driven processing
- Background workers
- Dependency inversion
- Separation of concerns

---

# Development Philosophy

The goal is **not** to build a tutorial project.

The goal is to build software similar to what a startup would deploy in production.

The architecture prioritizes:

- Maintainability
- Scalability
- Testability
- Clear ownership
- Replaceable providers
- Clean boundaries

---

# Architecture Highlights

- Monorepo using Turborepo
- One Docker Compose for local development
- Independent Dockerfile for every application
- Shared infrastructure packages
- Business logic separated into modules
- Background workers using BullMQ
- AI providers abstracted behind interfaces

---

# Current Development Status

The project is currently under active development.

Development follows milestone-based architecture rather than feature-based implementation.

Each milestone focuses on one responsibility before moving to the next.

---

# Planned Milestones

- Foundation
- Infrastructure
- Database
- Authentication
- Meeting Management
- Upload Pipeline
- Queue System
- Workers
- Audio Processing
- Transcription
- Speaker Mapping
- AI Summaries
- Embeddings
- Chat
- Chrome Extension
- Production Hardening
- Deployment

---

# Why This Project

MeetingLens is being built to demonstrate production-level software engineering concepts including:

- Monorepo architecture
- Dockerized development
- Queue-based systems
- Distributed workers
- AI orchestration
- Clean architecture
- Provider abstraction
- Scalable backend design

rather than simply integrating an LLM API.

---

# License

MIT
