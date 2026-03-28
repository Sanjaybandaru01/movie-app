// ================= PAGE LOAD =================
window.onload = () => {
  loadLatestMovies();
  loadGenres();
};

// ================= SEARCH MOVIE =================
document.getElementById("searchBtn")
  .addEventListener("click", searchMovie);

async function searchMovie() {
  const movie = document.getElementById("movieInput").value.trim();
  if (!movie) return;

  try {
    const res = await fetch(`/search?movie=${movie}`);
    const data = await res.json();

    document.getElementById("sectionTitle").innerText = "Search Results";
    displayMovies(data);
  } catch (err) {
    console.error("Search error:", err);
  }
}

// ================= LOAD LATEST MOVIES =================
async function loadLatestMovies() {
  try {
    const res = await fetch("/latest");
    const data = await res.json();

    document.getElementById("sectionTitle").innerText = "Latest Updates";
    displayMovies(data);
  } catch (err) {
    console.error("Latest movies error:", err);
  }
}

// ================= LOAD GENRES =================
async function loadGenres() {
  try {
    const res = await fetch("/genres");
    const genres = await res.json();

    const genreSelect = document.getElementById("genreSelect");

    genres.forEach(g => {
      const option = document.createElement("option");
      option.value = g.id;
      option.textContent = g.name;
      genreSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Genres error:", err);
  }
}

// ================= COMBINED FILTER (GENRE + LANGUAGE) =================
const genreSelect = document.getElementById("genreSelect");
const languageSelect = document.getElementById("languageSelect");

// Trigger filter when either changes
genreSelect.addEventListener("change", filterMovies);
languageSelect.addEventListener("change", filterMovies);

async function filterMovies() {
  const genre = genreSelect.value || "";
  const language = languageSelect.value || "";

  // If no filters → show latest again
  if (!genre && !language) {
    loadLatestMovies();
    return;
  }

  try {
    const res = await fetch(`/filter?genre=${genre}&language=${language}`);
    const data = await res.json();

    document.getElementById("sectionTitle").innerText =
      "Filtered Movies (Latest First)";

    displayMovies(data);
  } catch (err) {
    console.error("Filter error:", err);
  }
}

// ================= DISPLAY MOVIES =================
function displayMovies(movies) {
  const grid = document.getElementById("movieGrid");
  grid.innerHTML = "";

  if (!movies || movies.length === 0) {
    grid.innerHTML = "<p class='no-results'>No movies found.</p>";
    return;
  }

  movies.forEach(movie => {
    if (!movie.poster_path) return;

    const card = document.createElement("div");
    card.classList.add("movie-card");

    card.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" alt="${movie.title}">
      <h4>${movie.title}</h4>
      <p class="small-desc">
        ${movie.overview ? movie.overview.substring(0, 80) + "..." : "No description available"}
      </p>
      <p class="release-date">
        ${movie.release_date || ""}
      </p>
    `;

    card.addEventListener("click", () => {
      window.location.href = `movie.html?id=${movie.id}`;
    });

    grid.appendChild(card);
  });
}