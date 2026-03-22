const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 3001;
const SEARCH_FIELDS = new Set(["title", "author", "genre"]);
const SEARCH_RESULT_LIMIT = 8;
const RECOMMENDATION_LIMIT = 5;

const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "root",
  database: "books",
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function sendServerError(res, context, error) {
  console.error(`${context}:`, error);
  res.status(500).json({ error: "Server error" });
}

function getTrimmedQueryParam(value) {
  return typeof value === "string" ? value.trim() : "";
}

app.get("/api/search", async (req, res) => {
  try {
    const q = getTrimmedQueryParam(req.query.q);
    const field = getTrimmedQueryParam(req.query.field || "author").toLowerCase();

    if (!q) {
      return res.json([]);
    }

    if (!SEARCH_FIELDS.has(field)) {
      return res.status(400).json({ error: "field must be one of title, author, or genre" });
    }

    const params = [`%${q}%`];
    const searchQueries = {
      title: `
        SELECT book_id, title, author
        FROM books
        WHERE title LIKE ?
        ORDER BY title ASC, author ASC, book_id ASC
        LIMIT ${SEARCH_RESULT_LIMIT}
      `,
      author: `
        SELECT book_id, title, author
        FROM books
        WHERE author LIKE ?
        ORDER BY author ASC, title ASC, book_id ASC
        LIMIT ${SEARCH_RESULT_LIMIT}
      `,
      genre: `
        SELECT DISTINCT b.book_id, b.title, b.author
        FROM books b
        JOIN book_genres bg ON b.hardcover_id = bg.hardcover_id
        JOIN genres g ON bg.genre_id = g.genre_id
        WHERE g.genre_name LIKE ?
        ORDER BY b.title ASC, b.author ASC, b.book_id ASC
        LIMIT ${SEARCH_RESULT_LIMIT}
      `,
    };

    const [rows] = await pool.execute(searchQueries[field], params);
    res.json(rows);
  } catch (error) {
    sendServerError(res, "Search error", error);
  }
});

// ── Book Detail: GET /api/book/:id ──
app.get("/api/book/:id", async (req, res) => {
  try {
    const bookId = req.params.id;

    // Get book info
    const [books] = await pool.execute(
      `SELECT book_id, title, author, isbn, average_rating, description,
              cover_image_url, primary_genre, pages
       FROM books WHERE book_id = ?`,
      [bookId]
    );

    if (books.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Get all genres for this book
    const [genres] = await pool.execute(
      `SELECT g.genre_name
       FROM genres g
       JOIN book_genres bg ON g.genre_id = bg.genre_id
       JOIN books b ON b.hardcover_id = bg.hardcover_id
       WHERE b.book_id = ?`,
      [bookId]
    );

    const book = books[0];
    book.genres = genres.map((g) => g.genre_name);

    res.json(book);
  } catch (error) {
    console.error("Book detail error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Rate a Book: POST /api/rate ──
app.post("/api/rate", async (req, res) => {
  try {
    const { uid, book_id, rating } = req.body;

    if (!uid || !book_id || !rating) {
      return res.status(400).json({ error: "uid, book_id, and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Insert or update the rating
      await conn.execute(
        `INSERT INTO ratings (uid, book_id, rating)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE rating = ?`,
        [uid, book_id, rating, rating]
      );

      // Automatically add to read_books list
      await conn.execute(
        `INSERT IGNORE INTO read_books (uid, book_id) VALUES (?, ?)`,
        [uid, book_id]
      );

      // Remove from want_to_read if it exists (book can't be in both lists)
      await conn.execute(
        `DELETE FROM want_to_read WHERE uid = ? AND book_id = ?`,
        [uid, book_id]
      );

      await conn.commit();
      res.json({ message: "Rating saved", rating });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Rating error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Get ratings for a book: GET /api/book/:id/ratings ──
app.get("/api/book/:id/ratings", async (req, res) => {
  try {
    const bookId = req.params.id;

    const [rows] = await pool.execute(
      `SELECT AVG(rating) AS avg_rating, COUNT(*) AS num_ratings
       FROM ratings WHERE book_id = ?`,
      [bookId]
    );

    res.json({
      avg_rating: rows[0].avg_rating ? parseFloat(rows[0].avg_rating).toFixed(2) : null,
      num_ratings: rows[0].num_ratings,
    });
  } catch (error) {
    console.error("Get ratings error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Mark a book as read: POST /api/mark-read ──
app.post("/api/mark-read", async (req, res) => {
  try {
    const { uid, book_id } = req.body;

    if (!uid || !book_id) {
      return res.status(400).json({ error: "uid and book_id are required" });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Add to read_books
      await conn.execute(
        `INSERT IGNORE INTO read_books (uid, book_id) VALUES (?, ?)`,
        [uid, book_id]
      );

      // Remove from want_to_read (can't be in both)
      await conn.execute(
        `DELETE FROM want_to_read WHERE uid = ? AND book_id = ?`,
        [uid, book_id]
      );

      await conn.commit();
      res.json({ message: "Book marked as read" });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Mark a book as want-to-read: POST /api/mark-want-to-read ──
app.post("/api/mark-want-to-read", async (req, res) => {
  try {
    const { uid, book_id } = req.body;

    if (!uid || !book_id) {
      return res.status(400).json({ error: "uid and book_id are required" });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Add to want_to_read
      await conn.execute(
        `INSERT IGNORE INTO want_to_read (uid, book_id) VALUES (?, ?)`,
        [uid, book_id]
      );

      // Remove from read_books (can't be in both)
      await conn.execute(
        `DELETE FROM read_books WHERE uid = ? AND book_id = ?`,
        [uid, book_id]
      );

      await conn.commit();
      res.json({ message: "Book marked as want-to-read" });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Mark want-to-read error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Unmark a book (remove from both lists): POST /api/unmark ──
app.post("/api/unmark", async (req, res) => {
  try {
    const { uid, book_id } = req.body;

    if (!uid || !book_id) {
      return res.status(400).json({ error: "uid and book_id are required" });
    }

    await pool.execute(
      `DELETE FROM read_books WHERE uid = ? AND book_id = ?`,
      [uid, book_id]
    );
    await pool.execute(
      `DELETE FROM want_to_read WHERE uid = ? AND book_id = ?`,
      [uid, book_id]
    );

    res.json({ message: "Book unmarked" });
  } catch (error) {
    console.error("Unmark error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Get book status for a user: GET /api/book/:id/status?uid= ──
app.get("/api/book/:id/status", async (req, res) => {
  try {
    const bookId = req.params.id;
    const uid = req.query.uid;

    if (!uid) {
      return res.json({ status: null, rating: null });
    }

    const [readRows] = await pool.execute(
      `SELECT 1 FROM read_books WHERE uid = ? AND book_id = ?`,
      [uid, bookId]
    );

    const [wantRows] = await pool.execute(
      `SELECT 1 FROM want_to_read WHERE uid = ? AND book_id = ?`,
      [uid, bookId]
    );

    const [ratingRows] = await pool.execute(
      `SELECT rating FROM ratings WHERE uid = ? AND book_id = ?`,
      [uid, bookId]
    );

    let status = null;
    if (readRows.length > 0) status = "read";
    else if (wantRows.length > 0) status = "want-to-read";

    res.json({
      status,
      rating: ratingRows.length > 0 ? ratingRows[0].rating : null,
    });
  } catch (error) {
    console.error("Book status error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Recommendations: GET /api/recommendations/:id ──
app.get("/api/recommendations/:id", async (req, res) => {
  try {
    const bookId = parsePositiveInt(req.params.id);
    const uid = req.query.uid ? parsePositiveInt(req.query.uid) : null;

    if (!bookId) {
      return res.status(400).json({ error: "book id must be a positive integer" });
    }

    if (req.query.uid && !uid) {
      return res.status(400).json({ error: "uid must be a positive integer" });
    }

    const [books] = await pool.execute(
      `SELECT primary_genre FROM books WHERE book_id = ?`,
      [bookId]
    );

    if (books.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    const genre = books[0].primary_genre;

    if (!genre) {
      return res.json([]);
    }

    let sql = `
      SELECT b.book_id, b.title, b.author, b.cover_image_url, b.average_rating
      FROM books b
      WHERE b.primary_genre = ?
        AND b.book_id != ?
    `;
    const params = [genre, bookId];

    if (uid) {
      sql += `
        AND NOT EXISTS (
          SELECT 1
          FROM read_books rb
          WHERE rb.uid = ? AND rb.book_id = b.book_id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM want_to_read wtr
          WHERE wtr.uid = ? AND wtr.book_id = b.book_id
        )
      `;
      params.push(uid, uid);
    }

    sql += `
      ORDER BY b.average_rating DESC, b.title ASC, b.book_id ASC
      LIMIT ${RECOMMENDATION_LIMIT}
    `;

    const [rows] = await pool.execute(sql, params);

    res.json(rows);
  } catch (error) {
    sendServerError(res, "Recommendations error", error);
  }
});

// ── Register: POST /api/register ──
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required" });
    }

    const [existing] = await pool.execute(
      "SELECT uid FROM users WHERE username = ?",
      [username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const [result] = await pool.execute(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, password]
    );

    res.json({ uid: result.insertId, username });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Login: POST /api/login ──
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required" });
    }

    const [rows] = await pool.execute(
      "SELECT uid, username FROM users WHERE username = ? AND password = ?",
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ uid: rows[0].uid, username: rows[0].username });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── User Library: GET /api/user/:uid/library ──
app.get("/api/user/:uid/library", async (req, res) => {
  try {
    const uid = req.params.uid;

    const [readRows] = await pool.execute(
      `SELECT b.book_id, b.title, b.author, b.cover_image_url
       FROM read_books rb
       JOIN books b ON rb.book_id = b.book_id
       WHERE rb.uid = ?
       ORDER BY b.title ASC`,
      [uid]
    );

    const [wantRows] = await pool.execute(
      `SELECT b.book_id, b.title, b.author, b.cover_image_url
       FROM want_to_read wtr
       JOIN books b ON wtr.book_id = b.book_id
       WHERE wtr.uid = ?
       ORDER BY b.title ASC`,
      [uid]
    );

    res.json({ read_books: readRows, want_to_read: wantRows });
  } catch (error) {
    console.error("User library error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── User Ratings: GET /api/user/:uid/ratings ──
app.get("/api/user/:uid/ratings", async (req, res) => {
  try {
    const uid = req.params.uid;

    const [rows] = await pool.execute(
      `SELECT b.book_id, b.title, r.rating
       FROM ratings r
       JOIN books b ON r.book_id = b.book_id
       WHERE r.uid = ?
       ORDER BY b.title ASC`,
      [uid]
    );

    res.json(rows);
  } catch (error) {
    console.error("User ratings error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
