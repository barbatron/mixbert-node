import express from 'express';
import session from 'express-session';
import cors from "cors";
import path from "path";
import "localstorage-polyfill";

// Import configuration
import { PORT, SESSION_SECRET, validateConfig } from "./config";

// Import routes
import authRoutes from "./routes/auth";
import playlistRoutes from "./routes/playlists";
import syncRoutes from "./routes/sync";

// Validate configuration
if (!validateConfig()) {
  console.error(
    "Invalid configuration. Please check your .env file and try again."
  );
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Configure session
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Set up views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/auth", authRoutes);
app.use("/playlists", playlistRoutes);
app.use("/sync", syncRoutes);

// Home route
app.get("/", (req, res) => {
  res.render("index", {
    isLoggedInToSpotify: req.session.spotifyAccessToken ? true : false,
    // isLoggedInToTidal: req.session.tidalAccessToken ? true : false,
    isLoggedInToTidal: false,
  });
});

// Error handler for 404
app.use((req, res) => {
  res.status(404).render("error", {
    message: "Page not found",
    details: "The requested page does not exist.",
  });
});

// Global error handler
// @ts-ignore
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).render("error", {
    message: "Internal Server Error",
    details:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});