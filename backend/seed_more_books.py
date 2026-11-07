import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Book, Review
from app.schemas import ReviewCreate
import app.crud as crud

NEW_BOOKS = [
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "genre": "Fantasy",
        "published_year": 1937,
        "description": "Bilbo Baggins is a hobbit who enjoys a comfortable and unambitious life. But his contentment is disturbed when the wizard Gandalf and a company of thirteen dwarves arrive on his doorstep to whisk him away on an epic journey to reclaim the Lonely Mountain.",
        "cover_image": "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "FrodoB", "rating": 5, "comment": "Pure enchantment from the opening sentence. The greatest cozy adventure ever told."},
            {"reviewer_name": "Eowyn Shield", "rating": 5, "comment": "Tolkien created a world so vivid and timeless it never grows old."}
        ]
    },
    {
        "title": "Project Hail Mary",
        "author": "Andy Weir",
        "genre": "Sci-Fi",
        "published_year": 2021,
        "description": "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself are doomed. Except right now, he doesn't even remember his own name.",
        "cover_image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "Amaze Astro", "rating": 5, "comment": "Fist my bump! One of the best sci-fi friendships and problem-solving stories in modern fiction."},
            {"reviewer_name": "Dr. Stone", "rating": 5, "comment": "Scientific optimism at its absolute highest level."}
        ]
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "genre": "Classic",
        "published_year": 1949,
        "description": "Winston Smith toes the Party line, rewriting history to satisfy the Ministry of Truth. With every lie he writes, he grows to hate the Party that seeks power for its own sake and persecutes those who dare to commit thoughtcrime.",
        "cover_image": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "Julia M.", "rating": 5, "comment": "Chillingly prophetic. Every citizen of the digital age must read this book."},
            {"reviewer_name": "Eric Blair Fan", "rating": 4, "comment": "Uncompromising, grim, and utterly essential."}
        ]
    },
    {
        "title": "The Silent Patient",
        "author": "Alex Michaelides",
        "genre": "Mystery",
        "published_year": 2019,
        "description": "Alicia Berenson's life is seemingly perfect. A famous painter married to an in-demand fashion photographer. Then late one evening, Alicia shoots her husband five times in the face and never speaks another word.",
        "cover_image": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "Clara Oswald", "rating": 5, "comment": "That twist completely shattered my expectations! Finished it in a single sitting."},
            {"reviewer_name": "Detective Miles", "rating": 4, "comment": "A masterclass in psychological suspense and unreliable narration."}
        ]
    },
    {
        "title": "Sapiens: A Brief History of Humankind",
        "author": "Yuval Noah Harari",
        "genre": "Technology",
        "published_year": 2014,
        "description": "How did an insignificant ape become the ruler of planet Earth, capable of splitting the atom, flying to the Moon, and manipulating the genetic code of life? A groundbreaking survey of our shared evolutionary journey.",
        "cover_image": "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "Leo Vance", "rating": 5, "comment": "Reframed how I look at money, nations, religions, and corporations."},
            {"reviewer_name": "Nora Quinn", "rating": 5, "comment": "A sweeping, mind-bending historical overview written with clarity."}
        ]
    },
    {
        "title": "The Pragmatic Programmer",
        "author": "David Thomas & Andrew Hunt",
        "genre": "Technology",
        "published_year": 1999,
        "description": "Straight from the programming trenches, this book cuts through the increasing specialization and technicalities of modern software development to examine the core process of taking a requirement and producing working, maintainable code.",
        "cover_image": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "SeniorDev", "rating": 5, "comment": "Orthogonality, DRY, tracer bullets—principles every engineer needs."},
            {"reviewer_name": "CodeArtisan", "rating": 5, "comment": "Gold standard software craftsmanship."}
        ]
    },
    {
        "title": "The Midnight Library",
        "author": "Matt Haig",
        "genre": "Fiction",
        "published_year": 2020,
        "description": "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices.",
        "cover_image": "https://images.unsplash.com/photo-1507842229451-7f01be44c069?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "Sophie Bennett", "rating": 5, "comment": "Deeply comforting and life-affirming. Cured a lot of my personal regrets."},
            {"reviewer_name": "Oliver Twist", "rating": 4, "comment": "A warm, philosophical fairytale about embracing the present."}
        ]
    },
    {
        "title": "Thinking, Fast and Slow",
        "author": "Daniel Kahneman",
        "genre": "Self-Help",
        "published_year": 2011,
        "description": "Nobel laureate Daniel Kahneman takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think: System 1 is fast, intuitive, and emotional; System 2 is slower, more deliberative, and more logical.",
        "cover_image": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "RationalBrain", "rating": 5, "comment": "The definitive guide to cognitive biases and human decision making."}
        ]
    },
    {
        "title": "Harry Potter and the Sorcerer's Stone",
        "author": "J.K. Rowling",
        "genre": "Fantasy",
        "published_year": 1997,
        "description": "Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive. Addressed in green ink on yellowish parchment with a purple seal, they are swiftly confiscated by his aunt and uncle.",
        "cover_image": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "HermioneG", "rating": 5, "comment": "The book that made millions of children and adults fall in love with reading."},
            {"reviewer_name": "HogwartsAlum", "rating": 5, "comment": "Pure nostalgia and cozy magic."}
        ]
    },
    {
        "title": "The Alchemist",
        "author": "Paulo Coelho",
        "genre": "Fiction",
        "published_year": 1988,
        "description": "Paulo Coelho's masterpiece tells the mystical story of Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure. His quest will lead him to riches far different—and far more satisfying—than he ever imagined.",
        "cover_image": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "DesertDreamer", "rating": 5, "comment": "When you want something, all the universe conspires in helping you to achieve it."}
        ]
    },
    {
        "title": "Designing Data-Intensive Applications",
        "author": "Martin Kleppmann",
        "genre": "Technology",
        "published_year": 2017,
        "description": "Data is at the center of many challenges in system design today. Difficult issues need to be figured out, such as scalability, consistency, reliability, efficiency, and maintainability. The definitive bible for backend system architects.",
        "cover_image": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "CloudArchitect", "rating": 5, "comment": "The undisputed gold standard book for modern distributed systems engineers."}
        ]
    },
    {
        "title": "Meditations",
        "author": "Marcus Aurelius",
        "genre": "Classic",
        "published_year": 180,
        "description": "The private philosophical writings of the Roman Emperor Marcus Aurelius. Recorded as private notes to himself, Meditations is a cornerstone of Stoic philosophy emphasizing resilience, duty, and peace of mind.",
        "cover_image": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "StoicSoul", "rating": 5, "comment": "Remarkable that the thoughts of an emperor 1,800 years ago speak so directly to our modern struggles."}
        ]
    },
    {
        "title": "Deep Work: Rules for Focused Success",
        "author": "Cal Newport",
        "genre": "Self-Help",
        "published_year": 2016,
        "description": "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time.",
        "cover_image": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "FocusMaster", "rating": 5, "comment": "Eliminated shallow multitasking and doubled my productive output."}
        ]
    },
    {
        "title": "Neuromancer",
        "author": "William Gibson",
        "genre": "Sci-Fi",
        "published_year": 1984,
        "description": "Case was the sharpest data-thief in the matrix—until he crossed the wrong people and they crippled his nervous system. Now a mysterious new employer recruits him for a high-risk run at a radically artificial intelligence.",
        "cover_image": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
        "reviews": [
            {"reviewer_name": "CyberCowboy", "rating": 5, "comment": "Coined cyberspace and shaped the entire cyberpunk aesthetic. Pure lightning."}
        ]
    }
]

def seed_more():
    db = SessionLocal()
    added = 0
    for b in NEW_BOOKS:
        existing = db.query(Book).filter(Book.title == b["title"]).first()
        if not existing:
            reviews_data = b.pop("reviews", [])
            book = Book(**b)
            db.add(book)
            db.commit()
            db.refresh(book)
            for r in reviews_data:
                crud.add_review(db, book.id, ReviewCreate(**r))
            added += 1
            print(f"Added book: {book.title} ({book.genre})")
    
    total = db.query(Book).count()
    db.close()
    print(f"\n[DONE] Added {added} new books. Total books in database: {total}")

if __name__ == "__main__":
    seed_more()

