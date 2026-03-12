import dotenv from "dotenv";
import express from "express";
import { MongoClient } from "mongodb";
import path from "path";
import usersRoutes from "./routes/users.js"; // je bestaande users router

dotenv.config();

const app = express();
const PORT = 3000;
import xss from "xss";
// const xss = require("xss");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
app.get("/login", (req, res) => {
  res.render("login-cms");
});
app.get("/contact", (req, res) => {
  res.render("contact");
});



app.get("/cms/events", (req, res) => {
  res.render("events-cms");
});
app.get("/cms/createuser", (req, res) => {
  res.render("createUser-cms", {
    editMode: false,
    user: null
  });
});

// --- Users routes via users.js ---
async function start() {
  try {
    await client.connect();
    console.log("Verbonden met MongoDB");

    const db = client.db("CENDO");
    app.use("/cms/users", usersRoutes(db)); // koppelt GET /cms/users en POST /cms/users/create

    app.listen(PORT, () => {
      console.log(`Server draait op http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Fout bij starten:", err.message);
  }
}

start();