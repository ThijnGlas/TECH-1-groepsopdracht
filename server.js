import dotenv from "dotenv";
import express from "express";
import { MongoClient } from "mongodb";
import path from "path";

dotenv.config();

const app = express();
const PORT = 3000;

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// 👉 public map gebruiken
app.use(express.static("public"));

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
