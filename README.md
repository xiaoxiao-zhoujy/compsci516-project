# compsci516-project

Project for Duke COMPSCI 516: Database Systems (Spring 2026)

Homepage for `betterreads`.

## Instructions

1. Clone the repo

```bash
git clone https://github.com/clewis7/compsci516-project.git
```

2. Install dependencies

```bash
npm install
```

3. Make sure that [Docker](https://www.docker.com/) is installed and running

```bash
docker --version
```

4. Make sure that docker file is an executable

```bash
sudo chmod +x scripts/load_mysql_docker.sh
```

5. Launch the application

```bash
npm start
```

6. Open the website

```bash
http://localhost:3001
```

Can then see rendered version of website at: http://localhost:3001

----------------------------------------------------------------------

## Summary of recent changes

- Search now supports any combination of title, author, and genre fields. Results are ranked across exact, partial, and typo-tolerant matches, and the UI can show more than the original 8 results.
- Book shelves now include Read, Want to Read, and Currently Reading. Shelf actions are mutually exclusive, and activity/review creation works for books on any of those shelves.
- Reviews were reframed as activity. Ratings are optional, so users can leave comments or opinions without assigning stars.
- User profiles now support public profile viewing, profile links from book reviews, and different behavior for your own page versus another user's page.
- Social features now include one-way follows, mutual friend requests, social activity feeds, likes, and comments on activity.
- Other users' activity can be liked or commented on regardless of follow or friend status.

## API notes

### Search

`GET /api/search?title=<title>&author=<author>&genre=<genre>`

- All three query params are optional, but at least one non-blank search term is needed for results.
- Users can search by any combination of title, author, and genre.
- Search is ranked with exact, partial, and typo-tolerant matching.
- Results include a book summary plus match metadata such as `match_reason`.
- Legacy `q` and `field=<title|author|genre>` query params are still supported.

### Shelves and Library

- `POST /api/mark-read`
  - Marks a book as Read for a user.
- `POST /api/mark-want-to-read`
  - Marks a book as Want to Read for a user.
- `POST /api/mark-currently-reading`
  - Marks a book as Currently Reading for a user.
- `POST /api/unmark`
  - Removes a book from the user's shelves.
- `GET /api/book/:id/status?uid=<user id>`
  - Returns the user's current shelf status for a book.
- `GET /api/user/:uid/library`
  - Returns the user's Read, Want to Read, and Currently Reading shelves.

Shelf actions are mutually exclusive: marking a book for one shelf removes it from the others.

### Ratings

- `POST /api/rate`
  - Creates or updates a user's star rating for a book.
- `GET /api/book/:id/ratings`
  - Returns rating summary data for the book detail page.
- `GET /api/user/:uid/ratings`
  - Returns ratings left by a user.

### Recommendations

`GET /api/recommendations/:id`

- Recommendations are based on overlapping genres for the selected book.
- Results exclude the selected book itself.
- Candidates are ranked by shared genre overlap, then `average_rating`, and the UI can refresh through a weighted sample of strong matches.
- The route returns up to 5 books with the current recommendation card fields.
- Optional query param: `uid=<user id>`
  - When present, books already saved in the user's `read_books` or `want_to_read` lists are excluded.

### User Profiles and Auth

- `POST /api/register`
  - Creates a user account.
- `POST /api/login`
  - Logs in a user with username and password.
- `GET /api/profile-icons`
  - Lists available profile icons.
- `GET /api/user/:uid`
  - Returns public profile data. With `viewer_uid=<user id>`, it also returns relationship state for the viewer.
- `GET /api/user/:uid/profile-icon`
  - Returns the user's selected profile icon.
- `PATCH /api/user/:uid/profile-icon`
  - Updates the user's selected profile icon.

### Social

- `GET /api/users/search?q=<query>&uid=<viewer id>`
  - Searches for users and returns relationship state for the viewer.
- `POST /api/follow`
  - Follows another user. Follow is one-way.
- `POST /api/unfollow`
  - Unfollows another user.
- `POST /api/friend-request`
  - Sends a friend request, or accepts a reverse pending request.
- `POST /api/friend-request/respond`
  - Accepts or declines an incoming friend request.
- `GET /api/user/:uid/social`
  - Returns friends, pending requests, and followed users.

Friendship is mutual after acceptance; following is not.

### Activity and Reviews

- `POST /api/review`
  - Creates or updates user activity for a shelved book.
  - `rating` is optional, so activity can be saved as a comment/opinion without stars.
- `GET /api/book/:id/reviews?uid=<viewer id>`
  - Shows activity for a book, including reviewer profile links, like/comment counts, whether the viewer liked each item, and comments.
- `GET /api/user/:uid/reviews`
  - Shows activity created by a user.
- `GET /api/activity?uid=<viewer id>`
  - Returns the viewer's own activity plus activity from followed users and friends.
- `GET /api/activity?uid=<viewer id>&target_uid=<profile owner id>`
  - Returns a specific user's public activity for profile viewing.
- `POST /api/activity/:reviewId/like`
  - Likes an activity item.
- `POST /api/activity/:reviewId/unlike`
  - Removes the viewer's like.
- `POST /api/activity/:reviewId/comments`
  - Adds a comment to an activity item.

Users can like and comment on other users' activity without needing to follow them or be friends.

### Reading Challenges

- `POST /api/challenges`
  - Creates a reading challenge from the logged-in user's current Want to Read list.
- `POST /api/challenges/join`
  - Joins a challenge by invite code.
- `GET /api/challenges/user/:uid`
  - Lists the challenges a user belongs to.
- `GET /api/challenges/:id?uid=<user id>`
  - Returns challenge details, including members and shared books.

Challenge tables are created automatically when the server starts, so the feature works with the existing MySQL seed data.

## Load dataset into MySQL (Docker)

We provide a helper script to start a MySQL 8 container and load our SQL dump.

### 1. Make the script executable and run the loader

```bash
chmod +x scripts/load_mysql_docker.sh

./scripts/load_mysql_docker.sh data/book_data.sql
```

### 2. Running the MySQL database inside of the docker

```bash
mysql -h 127.0.0.1 -P 3306 -u root -proot books
```
