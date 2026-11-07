import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Star, 
  Search, 
  Plus, 
  MessageSquare, 
  Trash2, 
  X, 
  TrendingUp, 
  Sparkles, 
  BookMarked, 
  CheckCircle2, 
  User, 
  LogOut, 
  LogIn, 
  Zap, 
  Globe, 
  Download, 
  Loader2, 
  Check, 
  PenTool 
} from 'lucide-react';
import './App.css';

const API_BASE = 'http://127.0.0.1:8000';

const GENRES = ['All', 'Fiction', 'Classic', 'Sci-Fi', 'Technology', 'Self-Help', 'Fantasy', 'Mystery'];

const THEMES = [
  { id: 'sunset', label: 'Sunset Glow', icon: '🌅' },
  { id: 'academia', label: 'Dark Academia', icon: '☕' },
  { id: 'cyber', label: 'Cyber Neon', icon: '⚡' },
  { id: 'emerald', label: 'Emerald Jade', icon: '🌿' }
];

export default function App() {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState({
    total_books: 0,
    total_reviews: 0,
    average_platform_rating: 0.0,
    popular_genres: []
  });
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMyReviews, setOnlyMyReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Theme state
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('novelnest_theme') || 'sunset';
  });

  // User Authentication state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('novelnest_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [userReviews, setUserReviews] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMyReviewsModal, setShowMyReviewsModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    full_name: '',
    password: ''
  });
  const [authError, setAuthError] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addBookTab, setAddBookTab] = useState('openlibrary'); // 'openlibrary' or 'manual'
  const [selectedBook, setSelectedBook] = useState(null);
  
  // Toast notification
  const [toast, setToast] = useState('');

  // Open Library API state
  const [externalQuery, setExternalQuery] = useState('');
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalResults, setExternalResults] = useState([]);
  const [importedKeys, setImportedKeys] = useState({});

  // Manual Book Form state
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    genre: 'Fiction',
    published_year: new Date().getFullYear(),
    description: '',
    cover_image: ''
  });

  // Review Form state
  const [reviewForm, setReviewForm] = useState({
    reviewer_name: '',
    rating: 5,
    comment: ''
  });

  // Apply theme to html root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('novelnest_theme', currentTheme);
  }, [currentTheme]);

  // Pre-fill reviewer name when user is logged in
  useEffect(() => {
    if (currentUser) {
      setReviewForm((prev) => ({
        ...prev,
        reviewer_name: currentUser.full_name || currentUser.username
      }));
      fetchUserReviews(currentUser.id);
    } else {
      setUserReviews([]);
      setOnlyMyReviews(false);
    }
  }, [currentUser]);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Fetch books with current search, genre, and user review filters
  const fetchBooks = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedGenre !== 'All') params.append('genre', selectedGenre);
      if (onlyMyReviews && currentUser) {
        params.append('reviewed_by_user_id', currentUser.id);
      }
      
      const res = await fetch(`${API_BASE}/api/books?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch reviews written by the user
  const fetchUserReviews = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setUserReviews(data);
      }
    } catch (err) {
      console.error('Failed to fetch user reviews:', err);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchStats();
  }, [selectedGenre, searchQuery, onlyMyReviews]);

  // Check if current user has reviewed a book
  const hasUserReviewedBook = (bookId) => {
    return userReviews.some((r) => r.book_id === bookId);
  };

  // Search Open Library Free API for Books & Summaries
  const handleSearchOpenLibrary = async (e) => {
    e.preventDefault();
    if (!externalQuery.trim()) return;

    setExternalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/external/search-books?q=${encodeURIComponent(externalQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setExternalResults(data);
      } else {
        showNotification('Could not fetch books from Open Library');
      }
    } catch (err) {
      console.error('Open Library error:', err);
      showNotification('Error searching Open Library');
    } finally {
      setExternalLoading(false);
    }
  };

  // 1-Click Import Open Library Book into PostgreSQL Database
  const handleImportBook = async (bookData) => {
    try {
      const payload = {
        title: bookData.title,
        author: bookData.author,
        genre: bookData.genre,
        published_year: bookData.published_year || new Date().getFullYear(),
        description: bookData.description,
        cover_image: bookData.cover_image
      };

      const res = await fetch(`${API_BASE}/api/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setImportedKeys((prev) => ({ ...prev, [bookData.open_library_key || bookData.title]: true }));
        showNotification(`"${bookData.title}" imported from Open Library!`);
        fetchBooks();
        fetchStats();
      }
    } catch (err) {
      console.error('Import error:', err);
    }
  };

  // Handle User Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username_or_email: authForm.username,
          password: authForm.password
        })
      });

      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        localStorage.setItem('novelnest_user', JSON.stringify(user));
        setShowAuthModal(false);
        showNotification(`Welcome back, ${user.full_name || user.username}!`);
      } else {
        const err = await res.json();
        setAuthError(err.detail || 'Invalid username or password');
      }
    } catch (err) {
      setAuthError('Server connection error. Please try again.');
    }
  };

  // Handle User Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authForm.username,
          email: authForm.email,
          full_name: authForm.full_name || authForm.username,
          password: authForm.password
        })
      });

      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        localStorage.setItem('novelnest_user', JSON.stringify(user));
        setShowAuthModal(false);
        showNotification(`Account created! Welcome, ${user.full_name}!`);
      } else {
        const err = await res.json();
        setAuthError(err.detail || 'Registration failed');
      }
    } catch (err) {
      setAuthError('Server connection error. Please try again.');
    }
  };

  // Demo Login (instant 1-click test)
  const handleDemoLogin = () => {
    const demo = {
      id: 1,
      username: 'alexreader',
      email: 'alex@novelnest.com',
      full_name: 'Alex Turner'
    };
    setCurrentUser(demo);
    localStorage.setItem('novelnest_user', JSON.stringify(demo));
    setShowAuthModal(false);
    showNotification('Logged in as Alex Turner (Demo User)!');
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('novelnest_user');
    showNotification('Logged out successfully.');
  };

  // Handle Manual Add Book
  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBook.title.trim() || !newBook.author.trim()) return;

    try {
      const payload = {
        ...newBook,
        published_year: newBook.published_year ? parseInt(newBook.published_year, 10) : null,
        cover_image: newBook.cover_image.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
      };

      const res = await fetch(`${API_BASE}/api/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showNotification(`"${newBook.title}" added to PostgreSQL database!`);
        setNewBook({
          title: '',
          author: '',
          genre: 'Fiction',
          published_year: new Date().getFullYear(),
          description: '',
          cover_image: ''
        });
        setShowAddModal(false);
        fetchBooks();
        fetchStats();
      }
    } catch (err) {
      console.error('Error adding book:', err);
    }
  };

  // Handle Delete Book
  const handleDeleteBook = async (id, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/books/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification(`Book deleted successfully.`);
        if (selectedBook && selectedBook.id === id) setSelectedBook(null);
        fetchBooks();
        fetchStats();
        if (currentUser) fetchUserReviews(currentUser.id);
      }
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  // Handle Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedBook || !reviewForm.comment.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/books/${selectedBook.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser ? currentUser.id : null,
          reviewer_name: reviewForm.reviewer_name.trim() || (currentUser ? currentUser.full_name : 'Anonymous Reader'),
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim()
        })
      });

      if (res.ok) {
        showNotification('Review submitted successfully!');
        setReviewForm({ 
          reviewer_name: currentUser ? (currentUser.full_name || currentUser.username) : '', 
          rating: 5, 
          comment: '' 
        });
        
        // Refresh selected book details & user reviews
        const bookRes = await fetch(`${API_BASE}/api/books/${selectedBook.id}`);
        if (bookRes.ok) {
          const updatedBook = await bookRes.json();
          setSelectedBook(updatedBook);
        }
        fetchBooks();
        fetchStats();
        if (currentUser) fetchUserReviews(currentUser.id);
      }
    } catch (err) {
      console.error('Error adding review:', err);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-area">
          <div className="logo-icon">
            <BookOpen size={26} />
          </div>
          <div className="logo-text">
            <h1>NovelNest</h1>
            <p>Curated Book Reviews & Reading Community</p>
          </div>
        </div>

        <div className="header-right">
          {/* Theme Palette Switcher */}
          <div className="theme-switcher" title="Select Color Theme">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-pill-btn ${currentTheme === t.id ? 'active' : ''}`}
                onClick={() => setCurrentTheme(t.id)}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* User Login & "My Reviews" */}
          {currentUser ? (
            <div className="user-badge">
              <div className="user-avatar">
                {currentUser.full_name ? currentUser.full_name[0].toUpperCase() : 'U'}
              </div>
              <span className="user-name">{currentUser.full_name || currentUser.username}</span>
              
              <button 
                className="btn-my-reviews" 
                title="View books you have reviewed"
                onClick={() => setShowMyReviewsModal(true)}
              >
                <Star size={13} fill="#fbbf24" stroke="#fbbf24" />
                <span>My Reviews ({userReviews.length})</span>
              </button>

              <button className="btn-logout" title="Log Out" onClick={handleLogout}>
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button className="btn-login" onClick={() => { setAuthError(''); setShowAuthModal(true); }}>
              <User size={15} />
              Sign In
            </button>
          )}

          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add / Import Book
          </button>
        </div>
      </header>

      {/* Stats Ribbon */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-indigo">
            <BookMarked size={22} />
          </div>
          <div className="stat-info">
            <h3>{stats.total_books}</h3>
            <span>Total Catalog Books</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-amber">
            <Star size={22} />
          </div>
          <div className="stat-info">
            <h3>{stats.average_platform_rating} / 5.0</h3>
            <span>Community Avg Rating</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-emerald">
            <MessageSquare size={22} />
          </div>
          <div className="stat-info">
            <h3>{stats.total_reviews}</h3>
            <span>Reader Reviews</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-purple">
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <h3>{stats.popular_genres.length > 0 ? stats.popular_genres[0] : 'All Genres'}</h3>
            <span>Top Category</span>
          </div>
        </div>
      </section>

      {/* Action & Filter Bar */}
      <section className="action-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by title, author, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="genre-pills">
          {currentUser && (
            <button
              className={`genre-pill my-reviews-pill ${onlyMyReviews ? 'active' : ''}`}
              onClick={() => {
                setOnlyMyReviews(!onlyMyReviews);
                if (!onlyMyReviews) setSelectedGenre('All');
              }}
            >
              ⭐ My Reviewed Books ({userReviews.length})
            </button>
          )}

          {GENRES.map((genre) => (
            <button
              key={genre}
              className={`genre-pill ${selectedGenre === genre && !onlyMyReviews ? 'active' : ''}`}
              onClick={() => {
                setSelectedGenre(genre);
                setOnlyMyReviews(false);
              }}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* Books Grid */}
      <main className="books-grid">
        {books.length > 0 ? (
          books.map((book) => {
            const isReviewedByMe = currentUser && hasUserReviewedBook(book.id);
            return (
              <article key={book.id} className="book-card">
                <div className="book-cover-container">
                  <img
                    src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                    alt={book.title}
                    className="book-cover-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="book-cover-overlay"></div>
                  <span className="book-genre-tag">{book.genre}</span>

                  {isReviewedByMe && (
                    <span className="reviewed-badge">
                      <Check size={12} strokeWidth={3} />
                      Reviewed by You
                    </span>
                  )}
                </div>

                <div className="book-card-body">
                  <div className="book-card-header">
                    <h2 className="book-title">{book.title}</h2>
                    <p className="book-author">by {book.author} {book.published_year && `(${book.published_year})`}</p>
                  </div>

                  <div className="book-rating-row">
                    <div className="star-rating-badge">
                      <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                      <span>{book.rating > 0 ? book.rating.toFixed(1) : 'New'}</span>
                    </div>
                    <span className="reviews-counter">{book.reviews_count} {book.reviews_count === 1 ? 'review' : 'reviews'}</span>
                  </div>

                  <p className="book-desc">{book.description || 'No description provided yet.'}</p>

                  <div className="book-card-footer">
                    <button className="btn-card-action" onClick={() => setSelectedBook(book)}>
                      <MessageSquare size={14} />
                      {isReviewedByMe ? 'View & Edit Review' : 'Reviews & Rating'}
                    </button>
                    <button 
                      className="btn-delete" 
                      title="Delete Book"
                      onClick={(e) => handleDeleteBook(book.id, book.title, e)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <BookOpen size={48} />
            </div>
            <h3>{onlyMyReviews ? 'No reviews found by you yet' : 'No books found'}</h3>
            <p>
              {onlyMyReviews 
                ? 'You have not submitted a review for any book yet. Browse the catalog and leave your first star rating!'
                : "We couldn't find any books matching your search or filter. Try a different query or import one from Open Library!"}
            </p>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add or Import Book
            </button>
          </div>
        )}
      </main>

      {/* "My Reviews" Modal (User-specific reviews interface) */}
      {showMyReviewsModal && currentUser && (
        <div className="modal-overlay" onClick={() => setShowMyReviewsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Books Reviewed by {currentUser.full_name || currentUser.username}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  User ID: #{currentUser.id} • {userReviews.length} Total Reviewed {userReviews.length === 1 ? 'Book' : 'Books'}
                </p>
              </div>
              <button className="btn-close-modal" onClick={() => setShowMyReviewsModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {userReviews.length > 0 ? (
                <div>
                  {userReviews.map((rev) => (
                    <div key={rev.id} className="user-review-card">
                      <img 
                        src={rev.book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'} 
                        alt={rev.book.title}
                        className="user-review-thumb"
                      />
                      <div className="user-review-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                          <div>
                            <h4 style={{ color: '#fff', fontSize: '1.05rem', fontFamily: 'var(--font-serif)' }}>{rev.book.title}</h4>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>by {rev.book.author} • {rev.book.genre}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '2px', background: 'rgba(251, 191, 36, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={14} 
                                fill={i < rev.rating ? '#fbbf24' : 'none'} 
                                stroke="#fbbf24" 
                              />
                            ))}
                            <span style={{ color: '#fbbf24', fontSize: '0.82rem', fontWeight: '700', marginLeft: '0.3rem' }}>{rev.rating}.0</span>
                          </div>
                        </div>

                        <p style={{ color: '#cbd5e1', fontSize: '0.86rem', fontStyle: 'italic', margin: '0.5rem 0', lineHeight: '1.5' }}>
                          "{rev.comment}"
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            Reviewed on {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                          <button 
                            className="btn-card-action" 
                            style={{ flex: 'none', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                            onClick={() => {
                              setShowMyReviewsModal(false);
                              const fullBook = books.find(b => b.id === rev.book_id);
                              if (fullBook) setSelectedBook(fullBook);
                            }}
                          >
                            Open Book Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <Star size={40} color="#fbbf24" style={{ marginBottom: '1rem', opacity: 0.6 }} />
                  <h3 style={{ marginBottom: '0.5rem' }}>No reviews yet</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
                    You haven't posted any reviews yet under this account. Pick any book from the catalog and share your thoughts!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Import Book Modal (Free Open Library API + Manual) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add or Import Books</h2>
              <button className="btn-close-modal" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Tabs for Open Library vs Manual */}
              <div className="auth-tabs" style={{ marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  className={`auth-tab-btn ${addBookTab === 'openlibrary' ? 'active' : ''}`}
                  onClick={() => setAddBookTab('openlibrary')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
                >
                  <Globe size={16} />
                  Fetch via Free Open Library API
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${addBookTab === 'manual' ? 'active' : ''}`}
                  onClick={() => setAddBookTab('manual')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
                >
                  <PenTool size={16} />
                  Manual Entry
                </button>
              </div>

              {addBookTab === 'openlibrary' ? (
                <div>
                  <form onSubmit={handleSearchOpenLibrary} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div className="search-box" style={{ flex: 1, maxWidth: 'none' }}>
                      <Search size={16} className="search-icon" />
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Search any book or author (e.g. Frankenstein, Dracula, Isaac Asimov)..."
                        value={externalQuery}
                        onChange={(e) => setExternalQuery(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn-primary" disabled={externalLoading} style={{ flexShrink: 0 }}>
                      {externalLoading ? <Loader2 size={16} className="animate-spin" /> : 'Fetch Books'}
                    </button>
                  </form>

                  <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    💡 Searches millions of open-source books from the <strong>Internet Archive Open Library</strong>, pulling real covers, publication info, and full summaries with zero API keys required.
                  </p>

                  {externalResults.length > 0 && (
                    <div className="external-results-list">
                      {externalResults.map((item, idx) => {
                        const isImported = importedKeys[item.open_library_key || item.title];
                        return (
                          <div key={idx} className="external-book-card">
                            <img src={item.cover_image} alt={item.title} className="external-book-thumb" />
                            <div className="external-book-info">
                              <h4>{item.title}</h4>
                              <p className="author">by {item.author} {item.published_year && `(${item.published_year})`} • <span style={{ color: 'var(--primary)' }}>{item.genre}</span></p>
                              <p className="desc">{item.description}</p>
                              
                              <button
                                type="button"
                                className="btn-primary"
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                                disabled={isImported}
                                onClick={() => handleImportBook(item)}
                              >
                                {isImported ? (
                                  <>
                                    <Check size={14} />
                                    Imported to Database
                                  </>
                                ) : (
                                  <>
                                    <Download size={14} />
                                    Import to PostgreSQL
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleAddBook}>
                  <div className="form-group">
                    <label className="form-label">Book Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Sapiens: A Brief History of Humankind"
                      value={newBook.title}
                      onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Author Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="e.g. Yuval Noah Harari"
                        value={newBook.author}
                        onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Genre</label>
                      <select
                        className="form-select"
                        value={newBook.genre}
                        onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
                      >
                        {GENRES.filter((g) => g !== 'All').map((genre) => (
                          <option key={genre} value={genre}>{genre}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Published Year</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 2014"
                        value={newBook.published_year}
                        onChange={(e) => setNewBook({ ...newBook, published_year: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Cover Image URL (Optional)</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://images.unsplash.com/..."
                        value={newBook.cover_image}
                        onChange={(e) => setNewBook({ ...newBook, cover_image: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description / Synopsis</label>
                    <textarea
                      rows="4"
                      className="form-textarea"
                      placeholder="What is this book about? Share a brief summary..."
                      value={newBook.description}
                      onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                    ></textarea>
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Save Book to Database
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Login & Registration Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{authMode === 'login' ? 'Welcome Back' : 'Join NovelNest'}</h2>
              <button className="btn-close-modal" onClick={() => setShowAuthModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Tab Selector */}
              <div className="auth-tabs">
                <button 
                  className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                >
                  Sign In
                </button>
                <button 
                  className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                >
                  Create Account
                </button>
              </div>

              {authError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {authError}
                </div>
              )}

              {authMode === 'login' ? (
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label className="form-label">Username or Email</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. alexreader or alex@novelnest.com"
                      value={authForm.username}
                      onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      required
                      placeholder="••••••••"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <LogIn size={16} />
                    Sign In to Account
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <label className="form-label">Your Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Maya Lin"
                      value={authForm.full_name}
                      onChange={(e) => setAuthForm({ ...authForm, full_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. mayareads"
                      value={authForm.username}
                      onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      required
                      placeholder="maya@example.com"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Create Password</label>
                    <input
                      type="password"
                      className="form-input"
                      required
                      placeholder="Minimum 4 characters"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                    Register & Start Reading
                  </button>
                </form>
              )}

              {/* 1-Click Demo Login */}
              <div className="demo-login-box">
                <button type="button" className="btn-demo" onClick={handleDemoLogin}>
                  <Zap size={15} />
                  ⚡ Quick 1-Click Demo Login (as Alex Turner)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Reviews & Rating Modal */}
      {selectedBook && (
        <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedBook.title}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>by {selectedBook.author} • {selectedBook.genre}</p>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedBook(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                {selectedBook.description}
              </p>

              {/* Review Submission Form */}
              <form onSubmit={handleSubmitReview} style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                  <Sparkles size={16} color="#fbbf24" />
                  Leave a Review & Rating
                </h4>

                <div className="form-group">
                  <label className="form-label">Select Your Star Rating:</label>
                  <div className="star-selector">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className={`star-btn ${reviewForm.rating >= star ? 'active' : ''}`}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      >
                        <Star size={24} fill={reviewForm.rating >= star ? '#fbbf24' : 'none'} stroke="#fbbf24" />
                      </button>
                    ))}
                    <span style={{ marginLeft: '0.75rem', color: '#fbbf24', fontWeight: '700', alignSelf: 'center' }}>
                      {reviewForm.rating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Your Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Maya Lin"
                      value={reviewForm.reviewer_name}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewer_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Review Thoughts</label>
                  <textarea
                    rows="3"
                    className="form-textarea"
                    placeholder="Share what you liked, learned, or felt about this book..."
                    required
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Post Review
                </button>
              </form>

              {/* Reviews List */}
              <div className="reviews-section">
                <h3>
                  <MessageSquare size={18} />
                  Community Reviews ({selectedBook.reviews ? selectedBook.reviews.length : 0})
                </h3>

                {selectedBook.reviews && selectedBook.reviews.length > 0 ? (
                  selectedBook.reviews.map((rev) => (
                    <div key={rev.id} className="review-item">
                      <div className="review-item-header">
                        <span className="reviewer-name">
                          {rev.reviewer_name}
                          {currentUser && rev.user_id === currentUser.id && (
                            <span style={{ marginLeft: '0.5rem', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '700' }}>(You)</span>
                          )}
                        </span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={13} 
                              fill={i < rev.rating ? '#fbbf24' : 'none'} 
                              stroke="#fbbf24" 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="review-comment">"{rev.comment}"</p>
                      <div className="review-date">
                        {new Date(rev.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', fontStyle: 'italic' }}>
                    No reviews yet. Be the first to review this book above!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
