import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import express from "express";
import { MongoClient } from "mongodb";
import path from "path";
import authRoutes from "./routes/auth.js"; // login routes
import usersRoutes from "./routes/users.js"; // je bestaande users router
import eventsRoutes from "./routes/events.js";
import publicEventsRoutes from "./routes/events-public.js";
import locationsRoutes from "./routes/locations.js";
import artistsRoutes from "./routes/artists.js";

// import path from "path";
// import xss from "xss";
// const xss = require("xss");

dotenv.config();

const app = express();
const PORT = 3000;
import xss from "xss";

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// --- Middleware ---
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Session middleware ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supergeheimekey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: "CENDO",
      collectionName: "sessions",
    }),
    cookie: { maxAge: 1000 * 60 * 60 },
  }),
);

// EJS view engine
app.set("view engine", "ejs");

// --- Algemene pagina routes ---
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/faq", (req, res) => {
  res.render("FAQ");
});


app.get("/huisregels", (req, res) => {
  res.render("huisregels");
});

app.get("/artists", (req, res) => {
  res.render("artists");
});

//  BELANGRIJK: redirect /cms → /cms/login
app.get("/cms", (req, res) => {
  res.redirect("/cms/login"); //
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

// --- CMS routes ---

app.get("/cms/createLocation", (req, res) => {
  res.render("createLocation-cms");
});

app.get("/pre-register", (req, res) => {
  res.render("pre-register");
});
app.get("/houserules", (req, res) => {
  res.render("houserules");
});

app.get("/cms/createuser", (req, res) => {
  if (!req.session.userId) return res.redirect("/cms/login");
  res.render("createUser-cms", {
    editMode: false,
    user: null,
  });
});
app.get("/cms/createlocation", (req, res) => {
  res.render("createLocation-cms", {
    editMode: false,
    location: null,
  });
});
app.get("/cms/createartist", (req, res) => {
  res.render("createArtist-cms", {
    editMode: false,
    artist: null
  });
});



async function start() {
  try {
    await client.connect();
    console.log("Verbonden met MongoDB");

    const db = client.db("CENDO");

    app.use("/event", publicEventsRoutes(db));
    app.use("/events", publicEventsRoutes(db));

    app.use("/cms", authRoutes(db));
    app.use("/cms", authRoutes(db));
    app.use("/cms/users", usersRoutes(db));
    app.use("/cms/events", eventsRoutes(db));
    app.use("/cms/artists", artistsRoutes(db));
    app.use("/cms/locations", locationsRoutes(db));


    app.listen(PORT, () => {
      console.log(`Server draait op http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Fout bij starten:", err.message);
  }
}

start();
