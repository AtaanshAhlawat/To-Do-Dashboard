# 📋 To-Do Dashboard

A modern, full-stack task management application built with React, Node.js, and MongoDB.

## ✨ Features

- ✅ User Authentication (JWT-based)
- ✅ Task CRUD Operations
- ✅ Task Priorities (Low, Normal, High)
- ✅ Tags System
- ✅ Deadlines & Status Tracking
- ✅ Advanced Filtering & Sorting
- ✅ Drag & Drop Reordering
- ✅ Responsive Design

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (v4.4+)

### Installation

```bash
# Clone and install
git clone https://github.com/AtaanshAhlawat/To-Do-Dashboard.git
cd To-Do-Dashboard
npm install
cd backend && npm install && cd ..

# Set up environment (create backend/.env)
MONGODB_URI=mongodb://localhost:27017/todo-dashboard
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
PORT=3001

# Run the application
# Terminal 1 - MongoDB
mongod

# Terminal 2 - Backend
cd backend && npm run dev

# Terminal 3 - Frontend
npm run dev
```

Open http://localhost:5173

## 🏗️ Project Structure

```
To-Do-Dashboard/
├── backend/              # Node.js + Express + MongoDB
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Authentication
│   └── server.js
├── src/
│   ├── components/      # React components
│   │   ├── common/     # Reusable UI
│   │   ├── modals/     # Dialogs
│   │   └── tasks/      # Task components
│   ├── hooks/          # Custom hooks
│   ├── store/          # State management
│   ├── constants/      # Constants
│   └── utils/          # Utilities
└── package.json
```

## 🔧 Tech Stack

**Frontend:** React, Zustand, Vite, Lucide Icons  
**Backend:** Node.js, Express, MongoDB, JWT  
**Dev Tools:** ESLint, Git

## 🌐 Live Demo

[https://AtaanshAhlawat.github.io/To-Do](https://AtaanshAhlawat.github.io/To-Do)

---

Built with ❤️ by [Ataansh Ahlawat](https://github.com/AtaanshAhlawat)
