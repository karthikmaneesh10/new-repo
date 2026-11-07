# 📚 BookRev - Full-Stack Localhost Web Application

A full-stack, responsive book discovery and community review web application built with **Python FastAPI**, **PostgreSQL 17**, and **React**.

---

## 🚀 Quick Start (One-Click Launch)

Double click:
- `start_all.bat` — Launches both the FastAPI Backend and React Frontend.

Or start individually:
1. **Backend**: Run `run_backend.bat` (available at [http://localhost:8000](http://localhost:8000) and Swagger docs at [http://localhost:8000/docs](http://localhost:8000/docs))
2. **Frontend**: Run `run_frontend.bat` (available at [http://localhost:3000](http://localhost:3000))

---

## 🛠 Tech Stack Details

| Component | Technology | Version / Configuration | Port |
| :--- | :--- | :--- | :--- |
| **Frontend** | React + Vite | React 19, Lucide Icons, Modern CSS | `3000` |
| **Backend** | Python FastAPI | FastAPI, Uvicorn, SQLAlchemy, Pydantic | `8000` |
| **Database** | PostgreSQL | PostgreSQL 17 (pgAdmin 4) | `5432` |

---

## 🗄️ PostgreSQL Details & Credentials

- **Host**: `localhost` (`127.0.0.1`)
- **Port**: `5432`
- **Username**: `postgres`
- **Password**: `root`
- **Database Name**: `book rev`
- **Connection URI**: `postgresql+psycopg2://postgres:root@localhost:5432/book%20rev`

---

## 📁 Project Directory Structure

```text
book rev/
├── backend/
│   ├── app/
│   │   ├── __init__.py      # App package initializer
│   │   ├── config.py        # Environment variables & configuration
│   │   ├── database.py      # SQLAlchemy engine, session maker, get_db
│   │   ├── models.py        # Database models (Book, Review)
│   │   ├── schemas.py       # Pydantic validation schemas
│   │   ├── crud.py          # Database queries & review calculations
│   │   └── main.py          # FastAPI app, CORS, routes & seed data
│   ├── venv/                # Isolated Python Virtual Environment
│   ├── requirements.txt     # Python backend dependencies
│   └── .env                 # Database credentials & port config
├── frontend/
│   ├── public/              # Static assets & favicon
│   ├── src/
│   │   ├── App.jsx          # Main UI components, state & API fetch
│   │   ├── App.css          # Glassmorphism styling, layout & cards
│   │   ├── index.css        # Typography, variables & global design
│   │   └── main.jsx         # React root mounting
│   ├── index.html           # HTML template
│   ├── package.json         # React packages & scripts
│   └── vite.config.js       # Vite server port 3000 & API proxy
├── run_backend.bat          # Batch script to launch backend
├── run_frontend.bat         # Batch script to launch frontend
└── start_all.bat            # One-click dual launcher
```

