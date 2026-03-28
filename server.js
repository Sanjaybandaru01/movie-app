const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// ================= SEARCH MOVIE =================
app.get("/search", async (req, res) => {
  const movieName = req.query.movie;

  try {
    const response = await axios.get(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${movieName}`
    );

    res.json(response.data.results.slice(0, 20));

  } catch (err) {
    console.error(err.message);
    res.json([]);
  }
});

// ================= LATEST MOVIES =================
app.get("/latest", async (req, res) => {
  try {
    let movies = [];

    // Get latest movies
    const latestRes = await axios.get(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=primary_release_date.desc`
    );

    movies = latestRes.data.results;

    const today = new Date().toISOString().split("T")[0];

    // Remove future movies
    let filtered = movies.filter(m =>
      m.release_date && m.release_date <= today
    );

    // If less, add popular movies
    if (filtered.length < 20) {
      const popularRes = await axios.get(
        `${BASE_URL}/movie/popular?api_key=${API_KEY}`
      );

      filtered = filtered.concat(popularRes.data.results);
    }

    // Remove duplicates
    const unique = Array.from(
      new Map(filtered.map(m => [m.id, m])).values()
    );

    // Sort latest → old
    unique.sort(
      (a, b) => new Date(b.release_date) - new Date(a.release_date)
    );

    res.json(unique.slice(0, 20));

  } catch (err) {
    console.error(err.message);
    res.json([]);
  }
});

// ================= GET GENRES =================
app.get("/genres", async (req, res) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`
    );

    res.json(response.data.genres);

  } catch (err) {
    console.error(err.message);
    res.json([]);
  }
});

// ================= FILTER =================
app.get("/filter", async (req, res) => {
  const { genre, language } = req.query;

  try {
    let movies = [];

    // 🔹 Step 1: Get filtered movies
    const response = await axios.get(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=primary_release_date.desc`
    );

    const today = new Date().toISOString().split("T")[0];

    let filtered = response.data.results.filter(m =>
      m.release_date && m.release_date <= today
    );

    // Apply language
    if (language) {
      filtered = filtered.filter(m => m.original_language === language);
    }

    // Apply genre
    if (genre) {
      filtered = filtered.filter(m =>
        m.genre_ids && m.genre_ids.includes(Number(genre))
      );
    }

    // 🔹 Step 2: If less, fill with popular
    if (filtered.length < 20) {
      const popularRes = await axios.get(
        `${BASE_URL}/movie/popular?api_key=${API_KEY}`
      );

      const popular = popularRes.data.results;

      // Add only new movies (no duplicates)
      popular.forEach(p => {
        if (!filtered.find(m => m.id === p.id)) {
          filtered.push(p);
        }
      });
    }

    // 🔹 Step 3: Sort latest → old
    filtered.sort(
      (a, b) => new Date(b.release_date) - new Date(a.release_date)
    );

    res.json(filtered.slice(0, 20));

  } catch (err) {
    console.error(err.message);
    res.json([]);
  }
});

// ================= MOVIE DETAILS =================
app.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;

  try {
    const movieRes = await axios.get(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
    );

    const creditsRes = await axios.get(
      `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`
    );

    const providersRes = await axios.get(
      `${BASE_URL}/movie/${movieId}/watch/providers?api_key=${API_KEY}`
    );

    const indiaProviders = providersRes.data.results?.IN || {};

    const flatrate = indiaProviders.flatrate || [];
    const rent = indiaProviders.rent || [];
    const buy = indiaProviders.buy || [];

    const youtubeProvider =
      [...rent, ...buy].find(p =>
        p.provider_name.toLowerCase().includes("youtube")
      ) || null;

    res.json({
      id: movieRes.data.id,
      title: movieRes.data.title,
      overview: movieRes.data.overview,
      release_date: movieRes.data.release_date,
      poster_path: movieRes.data.poster_path,
      genres: movieRes.data.genres,
      cast: creditsRes.data.cast.slice(0, 5),
      flatrate: flatrate,
      youtube: youtubeProvider
    });

  } catch (err) {
    console.error(err.message);
    res.json({});
  }
});

// ================= SERVER START =================
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});