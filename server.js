import dotenv from "dotenv";
import express from "express";
import { MongoClient } from "mongodb";
import path from "path";

dotenv.config();

const app = express();
const PORT = 3000;

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

app.use(express.static("public"));
app.set("view engine", "ejs");
app.get("/", (req, res) => {
  console.log('dsfjko')
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

app.get("/cms/events", (req, res) => {
  res.render("events-cms");
});

app.get("/cms/users", (req, res) => {
  res.render("users-cms");
});

async function start() {
  try {
    await client.connect();
    console.log("Verbonden met MongoDB");

    app.listen(PORT, () => {
      console.log(`Server draait op http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Fout bij starten:", err.message);
  }
}

start();
