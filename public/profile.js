const uid = localStorage.getItem("uid");
const username = localStorage.getItem("username");
const profileIconUrl = localStorage.getItem("profile_icon_url");
const profileParams = new URLSearchParams(window.location.search);
const viewedUid = profileParams.get("uid") || uid;
const isOwnProfile = String(viewedUid) === String(uid);
const DEFAULT_PROFILE_ICON_PATHS = Array.from(
  { length: 6 },
  (_, index) => `/assets/icons/icon${index + 1}.png`,
);

const userNameEl = document.getElementById("user-name");
const readListEl = document.getElementById("read-list");
const currentListEl = document.getElementById("current-list");
const wantListEl = document.getElementById("want-list");
const readEmptyEl = document.getElementById("read-empty");
const currentEmptyEl = document.getElementById("current-empty");
const wantEmptyEl = document.getElementById("want-empty");
const challengeForm = document.getElementById("challenge-form");
const joinChallengeForm = document.getElementById("join-challenge-form");
const challengeNameEl = document.getElementById("challenge-name");
const challengeDescriptionEl = document.getElementById("challenge-description");
const challengeCodeEl = document.getElementById("challenge-code");
const challengeMessageEl = document.getElementById("challenge-message");
const challengeListEl = document.getElementById("challenge-list");
const challengeEmptyEl = document.getElementById("challenge-empty");
const challengeDetailEl = document.getElementById("challenge-detail");
const profileReviewForm = document.getElementById("profile-review-form");
const reviewBookSelectEl = document.getElementById("review-book-select");
const profileReviewRatingEl = document.getElementById("profile-review-rating");
const profileReviewTextEl = document.getElementById("profile-review-text");
const profileReviewMessageEl = document.getElementById("profile-review-message");
const profileReviewListEl = document.getElementById("profile-review-list");
const profileReviewEmptyEl = document.getElementById("profile-review-empty");
const currentProfileIconEl = document.getElementById("current-profile-icon");
const profileIconOptionsEl = document.getElementById("profile-icon-options");
const saveProfileIconBtn = document.getElementById("save-profile-icon-btn");
const profileIconMessageEl = document.getElementById("profile-icon-message");
const userSearchForm = document.getElementById("user-search-form");
const userSearchInput = document.getElementById("user-search-input");
const userSearchResultsEl = document.getElementById("user-search-results");
const socialMessageEl = document.getElementById("social-message");
const profileSocialActionsEl = document.getElementById("profile-social-actions");
const friendRequestsEl = document.getElementById("friend-requests");
const friendListEl = document.getElementById("friend-list");
const followingListEl = document.getElementById("following-list");
const activityFeedEl = document.getElementById("activity-feed");
const activityFeedEmptyEl = document.getElementById("activity-feed-empty");
const profileIconActionsEl = document.querySelector(".profile-icon-actions");
const personalReviewSectionEl = document.querySelector(".personal-review-section");
const socialSectionEl = document.querySelector(".social-section");
const activityFeedSectionEl = document.querySelector(".activity-feed-section");
const challengeSectionEl = document.querySelector(".challenge-section");

let selectedChallengeId = null;
let selectedProfileIconUrl =
  profileIconUrl && DEFAULT_PROFILE_ICON_PATHS.includes(profileIconUrl)
    ? profileIconUrl
    : DEFAULT_PROFILE_ICON_PATHS[0];

function createBookCard(book) {
  const card = document.createElement("div");
  card.style.width = "150px";
  card.style.textAlign = "center";

  const link = document.createElement("a");
  link.href = `book.html?id=${book.book_id}`;
  link.style.textDecoration = "none";
  link.style.color = "#333";

  const img = document.createElement("img");
  img.src = book.cover_image_url || "";
  img.alt = book.title;
  img.style.width = "120px";
  img.style.height = "180px";
  img.style.objectFit = "cover";
  img.style.borderRadius = "4px";
  img.style.border = "1px solid #ddd";

  const title = document.createElement("p");
  title.textContent = book.title;
  title.style.fontSize = "13px";
  title.style.fontWeight = "bold";
  title.style.margin = "8px 0 0";

  link.appendChild(img);
  link.appendChild(title);
  card.appendChild(link);

  return card;
}

function renderStars(rating) {
  if (!rating) {
    return "No rating";
  }

  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  let stars = "";
  for (let i = 1; i <= 5; i += 1) {
    stars += i <= safeRating ? "★" : "☆";
  }
  return stars;
}

function setSocialMessage(text, color = "#2a5db0") {
  socialMessageEl.textContent = text;
  socialMessageEl.style.color = text ? color : "";
}

function createReviewCard(review) {
  const card = document.createElement("article");
  card.className = "profile-review-card";

  const link = document.createElement("a");
  link.className = "profile-review-book";
  link.href = `book.html?id=${review.book_id}`;

  const cover = document.createElement("img");
  cover.src = review.cover_image_url || "";
  cover.alt = `${review.title} cover`;
  cover.onerror = () => {
    cover.style.display = "none";
  };

  const content = document.createElement("div");
  content.className = "profile-review-content";

  const title = document.createElement("h5");
  title.textContent = review.title;

  const author = document.createElement("p");
  author.className = "profile-review-author";
  author.textContent = `by ${review.author || "Unknown author"}`;

  const stars = document.createElement("p");
  stars.className = "review-stars";
  stars.textContent = renderStars(review.rating);

  const body = document.createElement("p");
  body.className = "review-body";
  body.textContent = review.review;

  content.appendChild(title);
  content.appendChild(author);
  content.appendChild(stars);
  content.appendChild(body);
  link.appendChild(cover);
  link.appendChild(content);
  card.appendChild(link);

  return card;
}

function createUserRow(user, actions = []) {
  const row = document.createElement("div");
  row.className = "social-user-row";

  const identity = document.createElement("div");
  identity.className = "social-user-identity";

  const icon = document.createElement("img");
  icon.className = "user-icon-small";
  icon.src = user.profile_icon_url || "/assets/icons/icon1.png";
  icon.alt = `${user.username} icon`;
  icon.onerror = () => {
    icon.src = "/assets/icons/icon1.png";
  };

  const name = document.createElement("span");
  name.textContent = user.username;

  identity.appendChild(icon);
  identity.appendChild(name);
  row.appendChild(identity);

  if (actions.length > 0) {
    const actionWrap = document.createElement("div");
    actionWrap.className = "social-user-actions";

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.className = "action-btn";
      button.type = "button";
      button.textContent = action.label;
      button.disabled = Boolean(action.disabled);
      button.addEventListener("click", action.onClick);
      actionWrap.appendChild(button);
    });

    row.appendChild(actionWrap);
  }

  return row;
}

function renderUserList(container, users, emptyText, getActions = () => []) {
  container.innerHTML = "";

  if (!users.length) {
    const empty = document.createElement("p");
    empty.className = "social-empty";
    empty.textContent = emptyText;
    container.appendChild(empty);
    return;
  }

  users.forEach((user) => {
    container.appendChild(createUserRow(user, getActions(user)));
  });
}

function createActivityCard(activity) {
  const card = document.createElement("article");
  card.className = "activity-card";

  const header = document.createElement("div");
  header.className = "activity-header";

  const user = document.createElement("span");
  user.className = "activity-user";

  const icon = document.createElement("img");
  icon.className = "user-icon-small";
  icon.src = activity.profile_icon_url || "/assets/icons/icon1.png";
  icon.alt = `${activity.username} icon`;
  icon.onerror = () => {
    icon.src = "/assets/icons/icon1.png";
  };

  user.appendChild(icon);
  user.appendChild(document.createTextNode(activity.username || "User"));

  const rating = document.createElement("span");
  rating.className = "review-stars";
  rating.textContent = renderStars(activity.rating);

  header.appendChild(user);
  header.appendChild(rating);

  const bookLink = document.createElement("a");
  bookLink.className = "activity-book-link";
  bookLink.href = `book.html?id=${activity.book_id}`;
  bookLink.textContent = `${activity.title} by ${activity.author || "Unknown"}`;

  const body = document.createElement("p");
  body.className = "review-body";
  body.textContent = activity.review;

  const actions = document.createElement("div");
  actions.className = "activity-actions";

  const likeButton = document.createElement("button");
  likeButton.className = "action-btn";
  likeButton.type = "button";
  likeButton.textContent = `${activity.liked_by_me ? "Unlike" : "Like"} (${activity.like_count || 0})`;
  likeButton.addEventListener("click", () => toggleActivityLike(activity));

  actions.appendChild(likeButton);

  const comments = document.createElement("div");
  comments.className = "activity-comments";

  (activity.comments || []).forEach((comment) => {
    const commentEl = document.createElement("p");
    commentEl.className = "activity-comment";
    commentEl.textContent = `${comment.username}: ${comment.comment}`;
    comments.appendChild(commentEl);
  });

  const commentForm = document.createElement("form");
  commentForm.className = "activity-comment-form";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Write a comment";
  input.maxLength = 500;

  const submit = document.createElement("button");
  submit.className = "action-btn";
  submit.type = "submit";
  submit.textContent = "Comment";

  commentForm.appendChild(input);
  commentForm.appendChild(submit);
  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await addActivityComment(activity.review_id, input.value.trim());
  });

  card.appendChild(header);
  card.appendChild(bookLink);
  card.appendChild(body);
  card.appendChild(actions);
  card.appendChild(comments);
  card.appendChild(commentForm);

  return card;
}

function createChallengeCard(challenge) {
  const card = document.createElement("div");
  card.className = "challenge-card";

  const title = document.createElement("h5");
  title.textContent = challenge.name;

  const creator = document.createElement("p");
  creator.className = "challenge-card-meta";
  creator.innerHTML = `<img class="user-icon-small" src="${challenge.creator_profile_icon_url || "/assets/icons/icon1.png"}" alt="${challenge.creator_name || "Creator"} icon" onerror="this.onerror=null;this.src='/assets/icons/icon1.png';" />Created by ${challenge.creator_name || "Unknown"}`;

  const meta = document.createElement("p");
  meta.className = "challenge-card-meta";
  meta.textContent = `${challenge.book_count} books • ${challenge.member_count} members`;

  const code = document.createElement("p");
  code.className = "challenge-card-code";
  code.textContent = `Invite code: ${challenge.invite_code}`;

  const button = document.createElement("button");
  button.className = "action-btn";
  button.textContent =
    Number(challenge.challenge_id) === Number(selectedChallengeId) ? "Viewing" : "View challenge";
  button.disabled = Number(challenge.challenge_id) === Number(selectedChallengeId);
  button.addEventListener("click", () => {
    loadChallengeDetail(challenge.challenge_id);
  });

  card.appendChild(title);
  card.appendChild(creator);
  card.appendChild(meta);
  card.appendChild(code);

  if (challenge.description) {
    const description = document.createElement("p");
    description.className = "challenge-card-description";
    description.textContent = challenge.description;
    card.appendChild(description);
  }

  card.appendChild(button);
  return card;
}

function setChallengeMessage(text, color = "#2a5db0") {
  challengeMessageEl.textContent = text;
  challengeMessageEl.style.color = text ? color : "";
}

function setProfileIconMessage(text, color = "#2a5db0") {
  profileIconMessageEl.textContent = text;
  profileIconMessageEl.style.color = text ? color : "";
}

function setProfileReviewMessage(text, color = "#2a5db0") {
  profileReviewMessageEl.textContent = text;
  profileReviewMessageEl.style.color = text ? color : "";
}

function renderReviewBookOptions(readBooks, currentBooks, wantBooks) {
  reviewBookSelectEl.innerHTML = '<option value="">Choose a book from your library</option>';

  const groups = [
    { label: "Books I've Read", books: readBooks },
    { label: "Currently Reading", books: currentBooks },
    { label: "Want to Read", books: wantBooks },
  ];

  groups.forEach((group) => {
    if (!group.books.length) return;

    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;

    group.books.forEach((book) => {
      const option = document.createElement("option");
      option.value = book.book_id;
      option.textContent = `${book.title} by ${book.author || "Unknown"}`;
      optgroup.appendChild(option);
    });

    reviewBookSelectEl.appendChild(optgroup);
  });

  reviewBookSelectEl.disabled =
    readBooks.length + currentBooks.length + wantBooks.length === 0;
}

function renderProfileIconOptions() {
  profileIconOptionsEl.innerHTML = "";

  DEFAULT_PROFILE_ICON_PATHS.forEach((iconPath) => {
    const optionBtn = document.createElement("button");
    optionBtn.type = "button";
    optionBtn.className = "profile-icon-option";
    optionBtn.classList.toggle("selected", iconPath === selectedProfileIconUrl);
    optionBtn.setAttribute("aria-label", `Choose ${iconPath.split("/").pop()}`);

    const img = document.createElement("img");
    img.src = iconPath;
    img.alt = "Profile icon option";

    optionBtn.appendChild(img);
    optionBtn.addEventListener("click", () => {
      selectedProfileIconUrl = iconPath;
      currentProfileIconEl.src = iconPath;
      renderProfileIconOptions();
      setProfileIconMessage("");
    });

    profileIconOptionsEl.appendChild(optionBtn);
  });
}

async function loadCurrentProfileIcon() {
  if (!ensureLoggedIn()) return;

  try {
    const res = await fetch(`/api/user/${viewedUid}/profile-icon`);
    const data = await res.json();

    if (res.ok && data.profile_icon_url) {
      selectedProfileIconUrl = data.profile_icon_url;
      if (isOwnProfile) {
        localStorage.setItem("profile_icon_url", data.profile_icon_url);
      }
    }
  } catch (error) {
    // Keep selectedProfileIconUrl fallback
  }

  currentProfileIconEl.src = selectedProfileIconUrl;
  if (isOwnProfile) {
    renderProfileIconOptions();
  } else {
    profileIconOptionsEl.innerHTML = "";
    if (profileIconActionsEl) profileIconActionsEl.style.display = "none";
  }
}

async function updateProfileIcon() {
  if (!ensureLoggedIn()) return;
  setProfileIconMessage("");

  try {
    const res = await fetch(`/api/user/${uid}/profile-icon`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_icon_url: selectedProfileIconUrl }),
    });
    const data = await res.json();

    if (!res.ok) {
      setProfileIconMessage(data.error || "Unable to update profile icon.", "red");
      return;
    }

    localStorage.setItem("profile_icon_url", data.profile_icon_url);
    currentProfileIconEl.src = data.profile_icon_url;
    setProfileIconMessage("Profile icon updated.", "green");
  } catch (error) {
    setProfileIconMessage("Unable to update profile icon right now.", "red");
  }
}

function ensureLoggedIn() {
  if (!uid) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

async function loadProfileHeader() {
  if (!ensureLoggedIn()) return;

  if (isOwnProfile) {
    userNameEl.textContent = username ? `Hello, ${username}!` : "Hello!";
    return;
  }

  try {
    const res = await fetch(
      `/api/user/${viewedUid}?viewer_uid=${encodeURIComponent(uid)}`,
    );
    const user = await res.json();

    if (!res.ok) {
      throw new Error(user.error || "Unable to load profile");
    }

    userNameEl.textContent = `${user.username}'s Profile`;
    renderViewedProfileActions(user);
  } catch (error) {
    userNameEl.textContent = "User Profile";
  }
}

function applyProfileMode() {
  if (isOwnProfile) return;

  if (profileReviewForm) profileReviewForm.style.display = "none";
  if (userSearchForm) userSearchForm.style.display = "none";
  if (userSearchResultsEl) userSearchResultsEl.style.display = "none";
  if (document.querySelector(".social-columns")) {
    document.querySelector(".social-columns").style.display = "none";
  }
  if (challengeSectionEl) challengeSectionEl.style.display = "none";
  if (personalReviewSectionEl) {
    personalReviewSectionEl.style.display = "none";
  }
  if (socialSectionEl) {
    const heading = socialSectionEl.querySelector("h3");
    const note = socialSectionEl.querySelector(".profile-section-note");
    if (heading) heading.textContent = "Connect";
    if (note) note.textContent = "Follow this user or send a friend request.";
  }
  if (activityFeedSectionEl) {
    const heading = activityFeedSectionEl.querySelector("h3");
    const note = activityFeedSectionEl.querySelector(".profile-section-note");
    if (heading) heading.textContent = "Activity";
    if (note) note.textContent = "Like or comment on this user's activity.";
  }
}

function renderViewedProfileActions(user) {
  if (!profileSocialActionsEl || isOwnProfile) return;

  const actions = [
    {
      label: user.is_following ? "Unfollow" : "Follow",
      onClick: () => updateFollow(user.uid, !user.is_following),
    },
  ];

  if (user.friendship_status === "accepted") {
    actions.push({ label: "Friends", disabled: true });
  } else if (
    user.friendship_status === "pending" &&
    Number(user.requested_by_uid) === Number(uid)
  ) {
    actions.push({ label: "Request sent", disabled: true });
  } else if (user.friendship_status === "pending") {
    actions.push({
      label: "Accept friend",
      onClick: () => requestFriend(user.uid),
    });
  } else {
    actions.push({
      label: "Add friend",
      onClick: () => requestFriend(user.uid),
    });
  }

  renderUserList(profileSocialActionsEl, [user], "", () => actions);
}

function renderChallengeList(challenges) {
  challengeListEl.innerHTML = "";

  if (!Array.isArray(challenges) || challenges.length === 0) {
    challengeEmptyEl.textContent = "You have not created or joined any challenges yet.";
    return;
  }

  challengeEmptyEl.textContent = "";
  challenges.forEach((challenge) => {
    challengeListEl.appendChild(createChallengeCard(challenge));
  });
}

async function fetchChallenges() {
  const res = await fetch(`/api/challenges/user/${uid}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Unable to load challenges");
  }

  return data;
}

async function loadChallengeDetail(challengeId) {
  selectedChallengeId = challengeId;

  try {
    const res = await fetch(`/api/challenges/${challengeId}?uid=${encodeURIComponent(uid)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Unable to load challenge");
    }

    const memberItems = data.members
      .map(
        (member) =>
          `<li><img class="user-icon-small" src="${member.profile_icon_url || "/assets/icons/icon1.png"}" alt="${member.username} icon" onerror="this.onerror=null;this.src='/assets/icons/icon1.png';" />${member.username}</li>`,
      )
      .join("");

    challengeDetailEl.innerHTML = `
      <div class="challenge-detail-card">
        <div class="challenge-detail-header">
          <div>
            <h4>${data.challenge.name}</h4>
            <p class="challenge-card-code">Invite code: ${data.challenge.invite_code}</p>
          </div>
          <p class="challenge-detail-meta">Created by ${data.challenge.creator_name}</p>
        </div>
        <p class="challenge-detail-meta"><img class="user-icon-small" src="${data.challenge.creator_profile_icon_url || "/assets/icons/icon1.png"}" alt="${data.challenge.creator_name} icon" onerror="this.onerror=null;this.src='/assets/icons/icon1.png';" />Challenge creator</p>
        ${
          data.challenge.description
            ? `<p class="challenge-detail-description">${data.challenge.description}</p>`
            : ""
        }
        <div class="challenge-detail-columns">
          <section>
            <h5>Members</h5>
            <ul class="challenge-member-list">${memberItems}</ul>
          </section>
          <section>
            <h5>Challenge books</h5>
            <div id="challenge-book-grid" class="challenge-book-grid"></div>
          </section>
        </div>
      </div>
    `;

    const challengeBookGrid = document.getElementById("challenge-book-grid");
    if (data.books.length === 0) {
      challengeBookGrid.innerHTML = '<p class="challenge-empty">No books in this challenge yet.</p>';
    } else {
      data.books.forEach((book) => challengeBookGrid.appendChild(createBookCard(book)));
    }

    renderChallengeList(await fetchChallenges());
  } catch (error) {
    challengeDetailEl.innerHTML =
      '<p class="challenge-empty">Unable to load challenge details right now.</p>';
  }
}

async function loadChallenges(preferredChallengeId) {
  if (!ensureLoggedIn()) return;

  try {
    const challenges = await fetchChallenges();
    renderChallengeList(challenges);

    if (!Array.isArray(challenges) || challenges.length === 0) {
      challengeDetailEl.innerHTML = "";
      selectedChallengeId = null;
      return;
    }

    const challengeId = preferredChallengeId || selectedChallengeId || challenges[0].challenge_id;
    await loadChallengeDetail(challengeId);
  } catch (error) {
    challengeEmptyEl.textContent = "Unable to load challenges right now.";
    challengeDetailEl.innerHTML = "";
  }
}

async function loadUserReviews() {
  if (!ensureLoggedIn()) return;

  try {
    const res = await fetch(`/api/user/${viewedUid}/reviews`);
    const reviews = await res.json();

    if (!res.ok) {
      throw new Error(reviews.error || "Unable to load reviews");
    }

    profileReviewListEl.innerHTML = "";

    if (!Array.isArray(reviews) || reviews.length === 0) {
      profileReviewEmptyEl.textContent = isOwnProfile
        ? "You have not posted any activity yet."
        : "No activity yet.";
      return;
    }

    profileReviewEmptyEl.textContent = "";
    reviews.forEach((review) => {
      profileReviewListEl.appendChild(createReviewCard(review));
    });
  } catch (error) {
    profileReviewEmptyEl.textContent = "Unable to load your activity right now.";
  }
}

async function loadSocial() {
  if (!ensureLoggedIn()) return;

  try {
    const res = await fetch(`/api/user/${uid}/social`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Unable to load social info");
    }

    renderUserList(
      friendRequestsEl,
      data.pending_requests || [],
      "No pending friend requests.",
      (user) => [
        {
          label: "Accept",
          onClick: () => respondToFriendRequest(user.uid, "accept"),
        },
        {
          label: "Decline",
          onClick: () => respondToFriendRequest(user.uid, "decline"),
        },
      ],
    );
    renderUserList(friendListEl, data.friends || [], "No friends yet.");
    renderUserList(followingListEl, data.following || [], "Not following anyone yet.", (user) => [
      {
        label: "Unfollow",
        onClick: () => updateFollow(user.uid, false),
      },
    ]);
  } catch (error) {
    setSocialMessage("Unable to load social info right now.", "red");
  }
}

async function searchUsers() {
  const query = userSearchInput.value.trim();
  userSearchResultsEl.innerHTML = "";
  setSocialMessage("");

  if (!query) {
    setSocialMessage("Enter a username to search.", "red");
    return;
  }

  try {
    const res = await fetch(
      `/api/users/search?uid=${encodeURIComponent(uid)}&q=${encodeURIComponent(query)}`,
    );
    const users = await res.json();

    if (!res.ok) {
      throw new Error(users.error || "Unable to search users");
    }

    renderUserList(userSearchResultsEl, users, "No users found.", (user) => {
      const actions = [
        {
          label: user.is_following ? "Unfollow" : "Follow",
          onClick: () => updateFollow(user.uid, !user.is_following),
        },
      ];

      if (user.friendship_status === "accepted") {
        actions.push({ label: "Friends", disabled: true });
      } else if (
        user.friendship_status === "pending" &&
        Number(user.requested_by_uid) === Number(uid)
      ) {
        actions.push({ label: "Request sent", disabled: true });
      } else if (user.friendship_status === "pending") {
        actions.push({
          label: "Accept friend",
          onClick: () => requestFriend(user.uid),
        });
      } else {
        actions.push({
          label: "Add friend",
          onClick: () => requestFriend(user.uid),
        });
      }

      return actions;
    });
  } catch (error) {
    setSocialMessage("Unable to search users right now.", "red");
  }
}

async function updateFollow(targetUid, shouldFollow) {
  const endpoint = shouldFollow ? "/api/follow" : "/api/unfollow";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: Number(uid), target_uid: Number(targetUid) }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Unable to update follow");
    }

    setSocialMessage(data.message, "green");
    await loadSocial();
    await loadProfileHeader();
    if (userSearchInput.value.trim()) await searchUsers();
    await loadActivityFeed();
  } catch (error) {
    setSocialMessage("Unable to update follow right now.", "red");
  }
}

async function requestFriend(targetUid) {
  try {
    const res = await fetch("/api/friend-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: Number(uid), target_uid: Number(targetUid) }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Unable to update friend request");
    }

    setSocialMessage(data.message, "green");
    await loadSocial();
    await loadProfileHeader();
    if (userSearchInput.value.trim()) await searchUsers();
    await loadActivityFeed();
  } catch (error) {
    setSocialMessage("Unable to update friend request right now.", "red");
  }
}

async function respondToFriendRequest(requesterUid, action) {
  try {
    const res = await fetch("/api/friend-request/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: Number(uid),
        requester_uid: Number(requesterUid),
        action,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Unable to respond to friend request");
    }

    setSocialMessage(data.message, "green");
    await loadSocial();
    await loadProfileHeader();
    await loadActivityFeed();
  } catch (error) {
    setSocialMessage("Unable to respond to friend request right now.", "red");
  }
}

async function loadActivityFeed() {
  if (!ensureLoggedIn()) return;

  try {
    const targetQuery = isOwnProfile
      ? ""
      : `&target_uid=${encodeURIComponent(viewedUid)}`;
    const res = await fetch(
      `/api/activity?uid=${encodeURIComponent(uid)}${targetQuery}`,
    );
    const activities = await res.json();

    if (!res.ok) {
      throw new Error(activities.error || "Unable to load activity");
    }

    activityFeedEl.innerHTML = "";

    if (!Array.isArray(activities) || activities.length === 0) {
      activityFeedEmptyEl.textContent = isOwnProfile
        ? "No activity yet. Follow people or add friends to see more here."
        : "No activity yet.";
      return;
    }

    activityFeedEmptyEl.textContent = "";
    activities.forEach((activity) => {
      activityFeedEl.appendChild(createActivityCard(activity));
    });
  } catch (error) {
    activityFeedEmptyEl.textContent = "Unable to load activity right now.";
  }
}

async function toggleActivityLike(activity) {
  const endpoint = activity.liked_by_me
    ? `/api/activity/${activity.review_id}/unlike`
    : `/api/activity/${activity.review_id}/like`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: Number(uid) }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Unable to update like");
    }

    await loadActivityFeed();
  } catch (error) {
    activityFeedEmptyEl.textContent = "Unable to update like right now.";
  }
}

async function addActivityComment(reviewId, comment) {
  if (!comment) return;

  try {
    const res = await fetch(`/api/activity/${reviewId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: Number(uid), comment }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Unable to add comment");
    }

    await loadActivityFeed();
  } catch (error) {
    activityFeedEmptyEl.textContent = "Unable to add comment right now.";
  }
}

async function loadLibrary() {
  if (!ensureLoggedIn()) return;

  try {
    const res = await fetch(`/api/user/${viewedUid}/library`);
    const data = await res.json();

    const readBooks = data.read_books || [];
    const currentBooks = data.currently_reading || [];
    const wantBooks = data.want_to_read || [];

    readListEl.innerHTML = "";
    currentListEl.innerHTML = "";
    wantListEl.innerHTML = "";
    if (isOwnProfile) {
      renderReviewBookOptions(readBooks, currentBooks, wantBooks);
    }

    if (readBooks.length === 0) {
      readEmptyEl.textContent = "You haven't added any books yet.";
    } else {
      readEmptyEl.textContent = "";
      readBooks.forEach((book) => readListEl.appendChild(createBookCard(book)));
    }

    if (currentBooks.length === 0) {
      currentEmptyEl.textContent = "You aren't reading any books right now.";
    } else {
      currentEmptyEl.textContent = "";
      currentBooks.forEach((book) =>
        currentListEl.appendChild(createBookCard(book)),
      );
    }

    if (wantBooks.length === 0) {
      wantEmptyEl.textContent = "You haven't added any books yet.";
    } else {
      wantEmptyEl.textContent = "";
      wantBooks.forEach((book) => wantListEl.appendChild(createBookCard(book)));
    }
  } catch (error) {
    readEmptyEl.textContent = "Unable to load your library right now.";
    currentEmptyEl.textContent = "";
    wantEmptyEl.textContent = "";
    renderReviewBookOptions([], [], []);
  }
}

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("uid");
  localStorage.removeItem("username");
  localStorage.removeItem("profile_icon_url");
  window.location.href = "login.html";
});

if (isOwnProfile) {
  saveProfileIconBtn.addEventListener("click", updateProfileIcon);

  userSearchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await searchUsers();
  });

  profileReviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setProfileReviewMessage("");

    try {
      const selectedRating = profileReviewRatingEl.value;
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: Number(uid),
          username: username || "User",
          book_id: Number(reviewBookSelectEl.value),
          rating: selectedRating ? Number(selectedRating) : null,
          review: profileReviewTextEl.value.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setProfileReviewMessage(data.error || "Unable to save activity.", "red");
        return;
      }

      setProfileReviewMessage("Activity saved to your profile.", "green");
      profileReviewForm.reset();
      await loadUserReviews();
      await loadActivityFeed();
    } catch (error) {
      setProfileReviewMessage("Unable to save activity right now.", "red");
    }
  });
}

challengeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setChallengeMessage("");

  try {
    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: Number(uid),
        name: challengeNameEl.value.trim(),
        description: challengeDescriptionEl.value.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setChallengeMessage(data.error || "Unable to create challenge.", "red");
      return;
    }

    setChallengeMessage(
      `Challenge created. Share invite code ${data.invite_code} with your teammates.`,
      "green"
    );
    challengeForm.reset();
    await loadChallenges(data.challenge_id);
  } catch (error) {
    setChallengeMessage("Unable to create challenge right now.", "red");
  }
});

joinChallengeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setChallengeMessage("");

  try {
    const res = await fetch("/api/challenges/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: Number(uid),
        invite_code: challengeCodeEl.value.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setChallengeMessage(data.error || "Unable to join challenge.", "red");
      return;
    }

    setChallengeMessage(
      data.joined
        ? `Joined "${data.name}".`
        : `You are already a member of "${data.name}".`,
      "green"
    );
    joinChallengeForm.reset();
    await loadChallenges(data.challenge_id);
  } catch (error) {
    setChallengeMessage("Unable to join challenge right now.", "red");
  }
});

applyProfileMode();
loadProfileHeader();
loadLibrary();
loadUserReviews();
if (isOwnProfile) {
  loadSocial();
  loadChallenges();
}
loadActivityFeed();
loadCurrentProfileIcon();
