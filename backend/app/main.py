import json
import urllib.request
import urllib.parse
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import CORS_ORIGINS
from app.database import engine, Base, get_db
from app.models import Book, Review, User
from app.schemas import (
    BookCreate, 
    BookUpdate, 
    BookResponse, 
    ReviewCreate, 
    ReviewResponse, 
    StatsResponse,
    UserRegister,
    UserLogin,
    UserResponse,
    UserReviewWithBook
)
import app.crud as crud

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables automatically on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="NovelNest API",
    description="Full-stack Book Review and Recommendation API built with FastAPI and PostgreSQL",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "message": "Welcome to NovelNest API!",
        "database": "PostgreSQL 17",
        "documentation": "/docs"
    }

# Authentication Endpoints
@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Auth"])
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = crud.get_user_by_username_or_email(db, user_in.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username is already taken")
    existing_email = crud.get_user_by_username_or_email(db, user_in.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email is already registered")
    return crud.create_user(db, user_in)

@app.post("/api/auth/login", response_model=UserResponse, tags=["Auth"])
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, login_data.username_or_email, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username/email or password")
    return user

# User-specific Reviews
@app.get("/api/users/{user_id}/reviews", response_model=List[UserReviewWithBook], tags=["Users"])
def read_user_reviews(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.get_user_reviews(db, user_id)

# Free Open-Source Book Search & Summary API (Open Library)
@app.get("/api/external/search-books", tags=["External Books"])
def search_open_library_books(q: str = Query(..., min_length=2, description="Book title, author, or keywords")):
    """
    Fetches real open-source book metadata, covers, and summaries from Open Library (Internet Archive).
    100% Free, no API key required.
    """
    try:
        encoded_query = urllib.parse.quote(q)
        url = f"https://openlibrary.org/search.json?q={encoded_query}&limit=6"
        req = urllib.request.Request(url, headers={"User-Agent": "NovelNest/1.0 (contact@novelnest.local)"})
        
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            docs = data.get("docs", [])

        results = []
        for doc in docs[:6]:
            title = doc.get("title", "Untitled")
            authors = doc.get("author_name", ["Unknown Author"])
            author = ", ".join(authors[:2])
            year = doc.get("first_publish_year")
            
            # Cover image URL from Open Library Covers Archive
            cover_id = doc.get("cover_i")
            cover_image = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80"
            
            # Map subjects to friendly genre
            subjects = doc.get("subject", [])
            genre = "Fiction"
            for s in subjects:
                s_lower = s.lower()
                if "fantasy" in s_lower:
                    genre = "Fantasy"
                    break
                elif "science fiction" in s_lower or "sci-fi" in s_lower:
                    genre = "Sci-Fi"
                    break
                elif "mystery" in s_lower or "detective" in s_lower or "thriller" in s_lower:
                    genre = "Mystery"
                    break
                elif "technology" in s_lower or "computer" in s_lower or "software" in s_lower:
                    genre = "Technology"
                    break
                elif "classic" in s_lower or "literature" in s_lower:
                    genre = "Classic"
                    break
                elif "self-help" in s_lower or "psychology" in s_lower or "philosophy" in s_lower:
                    genre = "Self-Help"
                    break

            # Try to fetch summary from works endpoint if available
            work_key = doc.get("key")
            description = None
            if work_key:
                try:
                    work_url = f"https://openlibrary.org{work_key}.json"
                    work_req = urllib.request.Request(work_url, headers={"User-Agent": "NovelNest/1.0"})
                    with urllib.request.urlopen(work_req, timeout=4) as w_resp:
                        w_data = json.loads(w_resp.read().decode("utf-8"))
                        desc_val = w_data.get("description")
                        if isinstance(desc_val, dict):
                            description = desc_val.get("value")
                        elif isinstance(desc_val, str):
                            description = desc_val
                except Exception:
                    description = None

            if not description and doc.get("first_sentence"):
                sentences = doc.get("first_sentence")
                description = sentences[0] if isinstance(sentences, list) else str(sentences)

            if not description:
                description = f"An acclaimed {genre.lower()} work by {author}, first published in {year or 'recent years'}. Explore key themes, characters, and ideas."

            # Clean up description markup/newlines
            description = description.replace("\r\n", " ").replace("\n", " ").strip()
            if len(description) > 600:
                description = description[:597] + "..."

            results.append({
                "title": title,
                "author": author,
                "genre": genre,
                "published_year": year,
                "description": description,
                "cover_image": cover_image,
                "open_library_key": work_key
            })

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch books from Open Library: {str(e)}")

@app.get("/api/stats", response_model=StatsResponse, tags=["Stats"])
def read_stats(db: Session = Depends(get_db)):
    return crud.get_stats(db)

@app.get("/api/books", response_model=List[BookResponse], tags=["Books"])
def read_books(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search title, author, or description"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    reviewed_by_user_id: Optional[int] = Query(None, description="Filter to books reviewed by user"),
    db: Session = Depends(get_db)
):
    return crud.get_books(db, skip=skip, limit=limit, search=search, genre=genre, reviewed_by_user_id=reviewed_by_user_id)

@app.get("/api/books/{book_id}", response_model=BookResponse, tags=["Books"])
def read_book(book_id: int, db: Session = Depends(get_db)):
    db_book = crud.get_book_by_id(db, book_id=book_id)
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    return db_book

@app.post("/api/books", response_model=BookResponse, status_code=status.HTTP_201_CREATED, tags=["Books"])
def create_book(book: BookCreate, db: Session = Depends(get_db)):
    return crud.create_book(db, book)

@app.put("/api/books/{book_id}", response_model=BookResponse, tags=["Books"])
def update_book(book_id: int, book_update: BookUpdate, db: Session = Depends(get_db)):
    db_book = crud.update_book(db, book_id, book_update)
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    return db_book

@app.delete("/api/books/{book_id}", tags=["Books"])
def delete_book(book_id: int, db: Session = Depends(get_db)):
    success = crud.delete_book(db, book_id)
    if not success:
        raise HTTPException(status_code=404, detail="Book not found")
    return {"message": f"Book {book_id} deleted successfully"}

@app.post("/api/books/{book_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED, tags=["Reviews"])
def add_review(book_id: int, review: ReviewCreate, db: Session = Depends(get_db)):
    db_review = crud.add_review(db, book_id=book_id, review_in=review)
    if not db_review:
        raise HTTPException(status_code=404, detail="Book not found")
    return db_review
