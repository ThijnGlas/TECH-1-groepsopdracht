import express from "express";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

export default function eventsRoutes(db) {
  const router = express.Router();

  // --- CREATE user ---
  router.post("/create", async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // simpele validatie
      if (!username || !email || !password) {
        return res.status(400).send("Alle velden zijn verplicht");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        username,
        email,
        password: hashedPassword,
        role: "admin",          // je kunt dit uitbreiden later
        createdAt: new Date(),
      };

      await db.collection("events").insertOne(newUser);

      // redirect naar de events lijst
      res.redirect("/cms/events");
    } catch (err) {
      console.error("Fout bij aanmaken gebruiker:", err);
      res.status(500).send("Fout bij aanmaken gebruiker");
    }
  });

  // --- GET edit user form ---
router.get("/edit/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await db.collection("events").findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).send("Gebruiker niet gevonden");
    }

    res.render("createUser-cms", { 
      user,      // bestaande data om in form te vullen
      editMode: true
    });
  } catch (err) {
    console.error("Fout bij ophalen gebruiker:", err);
    res.status(500).send("Fout bij ophalen gebruiker");
  }
});

  // --- READ all events ---
  router.get("/", async (req, res) => {
    try {
      const events = await db.collection("events").find().toArray();
      res.render("events-cms", { events }); // stuur events door naar EJS
    } catch (err) {
      console.error("Fout bij ophalen events:", err);
      res.status(500).send("Fout bij ophalen gebruikers");
    }
  });

  // --- UPDATE existing user ---
router.post("/edit/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, password } = req.body;

    if (!username || !email) {
      return res.status(400).send("Username en email zijn verplicht");
    }

    const updateData = { username, email };

    if (password) {
      // alleen update wachtwoord als er iets is ingevuld
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    await db.collection("events").updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    res.redirect("/cms/events");
  } catch (err) {
    console.error("Fout bij updaten gebruiker:", err);
    res.status(500).send("Fout bij updaten gebruiker");
  }
});

  // --- DELETE user ---
  router.post("/delete/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      await db.collection("events").deleteOne({ _id: new ObjectId(userId) });
      res.redirect("/cms/events");
    } catch (err) {
      console.error("Fout bij verwijderen gebruiker:", err);
      res.status(500).send("Fout bij verwijderen gebruiker");
    }
  });

  return router;
}