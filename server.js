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
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${movieName}&region=IN`
    );

    res.json(response.data.results.slice(0, 12));

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error fetching search results" });
  }
});

// ================= LATEST MOVIES =================
app.get("/latest", async (req, res) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=primary_release_date.desc`
    );

    const today = new Date().toISOString().split("T")[0];

    const movies = response.data.results.filter(m =>
      m.release_date && m.release_date <= today
    );

    res.json(movies.slice(0, 20));

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
    res.status(500).json({ error: "Error fetching genres" });
  }
});

// ================= COMBINED FILTER (GENRE + LANGUAGE) =================
// ================= COMBINED FILTER (GENRE + LANGUAGE) =================
app.get("/filter", async (req, res) => {
  const { genre, language } = req.query;

  try {
    let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=primary_release_date.desc`;

    if (genre) {
      url += `&with_genres=${genre}`;
    }

    if (language) {
      url += `&with_original_language=${language}`;
    }

    const response = await axios.get(url);

    const today = new Date().toISOString().split("T")[0];

    const movies = response.data.results.filter(m =>
      m.release_date && m.release_date <= today
    );

    res.json(movies.slice(0, 20));

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

    // Check if YouTube exists in rent or buy
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
    res.status(500).json({ error: "Error fetching movie details" });
  }
});

// ================= SERVER START =================
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});