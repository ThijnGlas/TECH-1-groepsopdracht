import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import express from "express";
import { MongoClient } from "mongodb";
import path from "path";
import usersRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js"; // ✅ login routes

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

app.get("/evenement", (req, res) => {
  res.render("evenement");
});

app.get("/events", (req, res) => {
  res.render("events");
});

app.get("/huisregels", (req, res) => {
  res.render("huisregels");
});

app.get("/artists", (req, res) => {
  res.render("artists");
});

// ❗ BELANGRIJK: redirect /cms → /cms/login
app.get("/cms", (req, res) => {
  res.redirect("/cms/login"); // ✅ toegevoegd
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

// --- CMS routes ---
app.get("/cms/events", (req, res) => {
  if (!req.session.userId) return res.redirect("/cms/login"); // ✅ aangepast
  res.render("events-cms");
});

app.get("/cms/createuser", (req, res) => {
  if (!req.session.userId) return res.redirect("/cms/login"); // ✅ beveiligd
  res.render("createUser-cms", {
    editMode: false,
    user: null,
  });
});

// --- Start server + routes ---
async function start() {
  try {
    await client.connect();
    console.log("Verbonden met MongoDB");

    const db = client.db("CENDO");

    // ✅ LOGIN ROUTES (nieuw)
    app.use("/cms", authRoutes(db));

    // bestaande users CMS routes
    app.use("/cms/users", usersRoutes(db));

    app.listen(PORT, () => {
      console.log(`Server draait op http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Fout bij starten:", err.message);
  }
}

start();
