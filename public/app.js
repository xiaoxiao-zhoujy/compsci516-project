async function searchBooks() {
  const titleInput = document.getElementById("titleInput");
  const authorInput = document.getElementById("authorInput");
  const genreInput = document.getElementById("genreInput");
  const resultsEl = document.getElementById("results");

  const searchParams = new URLSearchParams();
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const genre = genreInput.value.trim();

  resultsEl.innerHTML = "";

  if (!title && !author && !genre) {
    resultsEl.innerHTML = "<li>Please enter at least one search term.</li>";
    return;
  }

  if (title) searchParams.set("title", title);
  if (author) searchParams.set("author", author);
  if (genre) searchParams.set("genre", genre);

  try {
    const response = await fetch(`/api/search?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error("Search request failed");
    }

    const books = await response.json();

    if (!Array.isArray(books) || books.length === 0) {
      resultsEl.innerHTML = "<li>No results found.</li>";
      return;
    }

    books.forEach((book) => {
      resultsEl.appendChild(createSearchResultCard(book));
    });
  } catch (error) {
    console.error("Search failed:", error);
    resultsEl.innerHTML = "<li>Something went wrong while searching.</li>";
  }
}

function createSearchResultCard(book) {
  const li = document.createElement("li");
  li.className = "search-result-card";

  const link = document.createElement("a");
  link.className = "search-result-link";
  link.href = `book.html?id=${book.book_id}`;

  if (book.cover_image_url) {
    const cover = document.createElement("img");
    cover.className = "search-result-cover";
    cover.src = book.cover_image_url;
    cover.alt = `${book.title} cover`;
    link.appendChild(cover);
  } else {
    const coverPlaceholder = document.createElement("div");
    coverPlaceholder.className = "search-result-cover search-result-cover-placeholder";
    coverPlaceholder.textContent = "No Cover";
    link.appendChild(coverPlaceholder);
  }

  const content = document.createElement("div");
  content.className = "search-result-content";

  const title = document.createElement("h2");
  title.className = "search-result-title";
  title.textContent = book.title;

  const author = document.createElement("p");
  author.className = "search-result-author";
  author.textContent = `by ${book.author || "Unknown author"}`;

  const meta = document.createElement("div");
  meta.className = "search-result-meta";

  if (book.primary_genre || book.genres) {
    const genre = document.createElement("span");
    genre.className = "search-result-pill";
    genre.textContent = book.primary_genre || String(book.genres).split(",")[0];
    meta.appendChild(genre);
  }

  const rating = document.createElement("span");
  rating.className = "search-result-rating";
  rating.textContent = `Rating: ${
    book.average_rating ? Number(book.average_rating).toFixed(2) : "N/A"
  } / 5`;
  meta.appendChild(rating);

  content.appendChild(title);
  content.appendChild(author);
  content.appendChild(meta);

  if (book.match_reason) {
    const reason = document.createElement("p");
    reason.className = "search-match-reason";
    reason.textContent = book.match_reason;
    content.appendChild(reason);
  }

  const cta = document.createElement("span");
  cta.className = "search-result-cta";
  cta.textContent = "View details";
  content.appendChild(cta);

  link.appendChild(content);
  li.appendChild(link);
  return li;
}

["titleInput", "authorInput", "genreInput"].forEach((inputId) => {
  document.getElementById(inputId).addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchBooks();
    }
  });
});

document.getElementById("searchButton").addEventListener("click", searchBooks);

function renderAuthHeader() {
  const headerEl = document.getElementById("auth-header");
  if (!headerEl) return;

  const uid = localStorage.getItem("uid");
  const username = localStorage.getItem("username");
  const profileIconUrl = localStorage.getItem("profile_icon_url");

  headerEl.innerHTML = "";

  if (uid) {
    const link = document.createElement("a");
    link.href = "profile.html";
    link.className = "auth-user-link";

    const icon = document.createElement("img");
    icon.className = "auth-user-icon";
    icon.src = profileIconUrl || "/assets/icons/icon1.png";
    icon.alt = "Profile icon";

    const name = document.createElement("span");
    name.textContent = username || "User";

    link.appendChild(icon);
    link.appendChild(name);

    const logoutBtn = document.createElement("button");
    logoutBtn.className = "action-btn";
    logoutBtn.textContent = "Logout";
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("uid");
      localStorage.removeItem("username");
      localStorage.removeItem("profile_icon_url");
      window.location.href = "index.html";
    });

    headerEl.appendChild(link);
    headerEl.appendChild(logoutBtn);
  } else {
    const link = document.createElement("a");
    link.href = "login.html";
    link.textContent = "Login / Register";
    headerEl.appendChild(link);
  }
}

renderAuthHeader();
