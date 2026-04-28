# 🧠 SOP Agent (AI Knowledge Base)

An AI-powered system that allows users to upload documents (SOPs) and ask questions based on them. The system retrieves relevant information and generates accurate answers with sources using RAG (Retrieval Augmented Generation).

---

## 🚀 Features

- 📄 Upload PDF documents (SOPs)
- 🔍 Smart search using vector embeddings
- 🤖 AI-generated answers using LLM (Gemini / Groq)
- 📚 Source-based responses (no hallucination)
- 💬 Chat interface for querying documents
- ⚡ Fast and structured retrieval system

---

## 🧠 Tech Stack

### Frontend:

- React.js
- Axios

### Backend:

- Node.js
- Express.js
- MongoDB Atlas (Vector Search)

### AI:

- Gemini 1.5 Flash / Llama 3 (Groq)
- LangChain.js / LlamaIndex (optional)

---

## ⚙️ Project Structure

sop-agent/
│
├── client/ # React frontend
├── server/ # Node.js backend
├── README.md

---

## 🔄 How It Works (RAG Flow)

1. User uploads PDF
2. Backend parses and splits text into chunks
3. Chunks are converted into embeddings
4. Stored in MongoDB (vector database)
5. User asks a question
6. Relevant chunks are retrieved
7. AI generates answer using context
8. Response + source is shown to user

---

## 🔌 API Endpoints

### Upload PDF

POST /upload

### Ask Question

POST /query

---

## 🛠️ Setup Instructions

### 1. Clone Repo

git clone <repo-link>
cd sop-agent

### 2. Backend Setup

cd server
npm install
npm start

### 3. Frontend Setup

cd client
npm install
npm start

---

## 🔐 Environment Variables (.env)

MONGO_URI=your_mongodb_uri
LLM_API_KEY=your_api_key

---

## 👥 Team Roles

- **Frontend:** UI, Chat Interface, Upload UI
- **Backend:** PDF parsing, chunking, DB storage
- **AI Integration:** LLM, prompts, response generation
- **Integration & Testing:** API connection, debugging

---

## ⚠️ Important Notes

- Do NOT call LLM directly without retrieval
- Always show source with answers
- Follow proper Git workflow (branches + PR)

---

## 🎯 Goal

Build a real-world AI system that converts static documents into an intelligent, searchable knowledge base.

---

## 📌 Future Improvements

- Streaming responses (SSE)
- Multi-document support
- User authentication
- Dashboard analytics

---

## 💡 Author

Team Project - SOP Agent 🚀
