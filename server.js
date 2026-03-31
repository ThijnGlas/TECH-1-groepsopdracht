// importeren van benodigde modules
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import express from "express";
import { MongoClient } from "mongodb";

// importeren van alle route bestanden
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import eventsRoutes from "./routes/events.js";
import publicEventsRoutes from "./routes/events-public.js";
import locationsRoutes from "./routes/locations.js";
import artistsRoutes from "./routes/artists.js";

// .env bestand inladen zodat je de variabelen kan gebruiken
dotenv.config();

const app = express();
const PORT = 3000;

// mongodb verbinding aanmaken met de uri uit de .env
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// publieke bestanden zoals css, afbeeldingen en js serveren vanuit de public map
app.use(express.static("public"));
// zorgt ervoor dat je formulierdata kan lezen via req.body
app.use(express.urlencoded({ extended: true }));
// zorgt ervoor dat je json data kan lezen via req.body
app.use(express.json());

// sessies bijhouden zodat gebruikers ingelogd kunnen blijven
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supergeheimekey",
    resave: false,
    saveUninitialized: false,
    // sessies opslaan in mongodb zodat ze niet verloren gaan bij een herstart
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: "CENDO",
      collectionName: "sessions",
    }),
    // sessie verloopt na 1 uur
    cookie: { maxAge: 1000 * 60 * 60 },
  }),
);

// EJS instellen als view engine zodat je .ejs bestanden kan renderen
app.set("view engine", "ejs");

// Algemene pagina routes 
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/faq", (req, res) => {
  res.render("FAQ");
});

app.get("/huisregels", (req, res) => {
  res.render("huisregels");
});

// artiesten ophalen uit de database en alfabetisch sorteren
app.get("/artists", async (req, res) => {
  const db = client.db("CENDO");
  const artists = await db.collection("artists").find({}).sort({ name: 1 }).toArray();
  res.render("artists", { artists });
});

// /cms stuurt altijd door naar de loginpagina
app.get("/cms", (req, res) => {
  res.redirect("/cms/login");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

//  CMS routes
app.get("/cms/createLocation", (req, res) => {
  res.render("createLocation-cms");
});

app.get("/pre-register", (req, res) => {
  res.render("pre-register");
});

app.get("/houserules", (req, res) => {
  res.render("houserules");
});

// formulier voor een nieuwe gebruiker, alleen toegankelijk als je ingelogd bent
app.get("/cms/createuser", (req, res) => {
  if (!req.session.userId) return res.redirect("/cms/login");
  res.render("createUser-cms", {
    editMode: false,
    user: null,
  });
});

// formulier voor een nieuw event, locaties ophalen zodat je die kan kiezen
app.get("/cms/createevent", async (req, res) => {
  const db = client.db("CENDO");
  const locations = await db.collection("locations").find().toArray();
  res.render("createevent-cms", {
    editMode: false,
    event: null,
    locations
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

// server starten en verbinding maken met mongodb
async function start() {
  try {
    await client.connect();
    console.log("Verbonden met MongoDB");

    const db = client.db("CENDO");

    // routes koppelen aan de juiste paden
    app.use("/event", publicEventsRoutes(db));
    app.use("/events", publicEventsRoutes(db));
    app.use("/cms", authRoutes(db));
    app.use("/cms/events", eventsRoutes(db));
    app.use("/cms/users", usersRoutes(db));
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