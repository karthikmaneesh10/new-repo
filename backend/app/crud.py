from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Book, Review, User
from app.schemas import BookCreate, BookUpdate, ReviewCreate, UserRegister

def get_user_by_username_or_email(db: Session, identifier: str):
    return db.query(User).filter(
        (User.username.ilike(identifier)) | (User.email.ilike(identifier))
    ).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user_in: UserRegister):
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name or user_in.username,
        password=user_in.password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, identifier: str, password: str):
    user = get_user_by_username_or_email(db, identifier)
    if not user:
        return None
    if user.password != password:
        return None
    return user

def get_books(db: Session, skip: int = 0, limit: int = 100, search: str = None, genre: str = None, reviewed_by_user_id: int = None):
    query = db.query(Book)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Book.title.ilike(search_filter)) | 
            (Book.author.ilike(search_filter)) |
            (Book.description.ilike(search_filter))
        )
    if genre and genre != "All":
        query = query.filter(Book.genre.ilike(genre))
    if reviewed_by_user_id:
        user = get_user_by_id(db, reviewed_by_user_id)
        names = [user.username, user.full_name] if user else []
        query = query.join(Review).filter(
            (Review.user_id == reviewed_by_user_id) | 
            (Review.reviewer_name.in_(names))
        ).distinct()
    return query.order_by(Book.id.desc()).offset(skip).limit(limit).all()

def get_book_by_id(db: Session, book_id: int):
    return db.query(Book).filter(Book.id == book_id).first()

def create_book(db: Session, book_in: BookCreate):
    db_book = Book(**book_in.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

def update_book(db: Session, book_id: int, book_update: BookUpdate):
    db_book = get_book_by_id(db, book_id)
    if not db_book:
        return None
    update_data = book_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_book, key, value)
    db.commit()
    db.refresh(db_book)
    return db_book

def delete_book(db: Session, book_id: int):
    db_book = get_book_by_id(db, book_id)
    if not db_book:
        return False
    db.delete(db_book)
    db.commit()
    return True

def add_review(db: Session, book_id: int, review_in: ReviewCreate):
    db_book = get_book_by_id(db, book_id)
    if not db_book:
        return None
    
    # Create the review with user_id
    db_review = Review(
        book_id=book_id,
        user_id=review_in.user_id,
        reviewer_name=review_in.reviewer_name,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    # Recompute average rating and reviews count for the book
    reviews = db.query(Review).filter(Review.book_id == book_id).all()
    db_book.reviews_count = len(reviews)
    if reviews:
        db_book.rating = round(sum(r.rating for r in reviews) / len(reviews), 1)
    else:
        db_book.rating = 0.0

    db.commit()
    db.refresh(db_book)
    return db_review

def get_user_reviews(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if not user:
        return []
    
    names = [user.username, user.full_name] if user else []
    reviews = db.query(Review).filter(
        (Review.user_id == user_id) | 
        (Review.reviewer_name.in_(names))
    ).order_by(Review.created_at.desc()).all()
    return reviews

def get_stats(db: Session):
    total_books = db.query(func.count(Book.id)).scalar() or 0
    total_reviews = db.query(func.count(Review.id)).scalar() or 0
    avg_rating = db.query(func.avg(Review.rating)).scalar() or 0.0

    genres = db.query(Book.genre, func.count(Book.genre)).group_by(Book.genre).order_by(func.count(Book.genre).desc()).limit(5).all()
    popular_genres = [g[0] for g in genres if g[0]]

    return {
        "total_books": total_books,
        "total_reviews": total_reviews,
        "average_platform_rating": round(float(avg_rating), 1),
        "popular_genres": popular_genres
    }
