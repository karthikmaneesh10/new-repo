from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=5, max_length=120)
    full_name: Optional[str] = "Avid Reader"
    password: str = Field(min_length=4)

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Review Schemas
class ReviewBase(BaseModel):
    reviewer_name: str = Field(default="Anonymous Reader", max_length=100)
    user_id: Optional[int] = None
    rating: int = Field(ge=1, le=5, description="Rating from 1 to 5 stars")
    comment: str = Field(min_length=3, description="Review feedback or thoughts")

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    id: int
    book_id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Book Schemas
class BookBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    author: str = Field(min_length=1, max_length=255)
    genre: str = Field(default="Fiction", max_length=100)
    description: Optional[str] = None
    cover_image: Optional[str] = None
    published_year: Optional[int] = None

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    genre: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    published_year: Optional[int] = None

class BookResponse(BookBase):
    id: int
    rating: float
    reviews_count: int
    created_at: datetime
    reviews: List[ReviewResponse] = []

    class Config:
        from_attributes = True

class BookSummary(BaseModel):
    id: int
    title: str
    author: str
    genre: str
    cover_image: Optional[str] = None
    rating: float

    class Config:
        from_attributes = True

class UserReviewWithBook(BaseModel):
    id: int
    book_id: int
    user_id: Optional[int] = None
    reviewer_name: str
    rating: int
    comment: str
    created_at: datetime
    book: BookSummary

    class Config:
        from_attributes = True

# Stats Schema
class StatsResponse(BaseModel):
    total_books: int
    total_reviews: int
    average_platform_rating: float
    popular_genres: List[str]
