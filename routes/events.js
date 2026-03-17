import express from "express";
import { ObjectId } from "mongodb"; 

export default function eventsRoutes(db) {
  const router = express.Router();

  // --- CREATE user ---
    router.post("/create", async (req, res) => {
    try {
        const { title, date, location } = req.body;

        if (!title || !date) {
        return res.status(400).send("Titel en datum zijn verplicht");
        }

        const newEvent = {
        title,
        date: new Date(date),
        location,
        createdAt: new Date(),
        };

        await db.collection("events").insertOne(newEvent);

        res.redirect("/cms/events");
    } catch (err) {
        console.error("Fout bij aanmaken event:", err);
        res.status(500).send("Fout bij aanmaken event");
    }
    });

  // --- READ all users ---
  router.get("/", async (req, res) => {
    try {
      const events = await db.collection("events").find().toArray();
      res.render("events-cms", { events }); // stuur users door naar EJS
    } catch (err) {
      console.error("Fout bij ophalen events:", err);
      res.status(500).send("Fout bij ophalen events");
    }
  });

// --- DELETE event ---
router.post("/delete/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    await db.collection("events").deleteOne({ _id: new ObjectId(eventId) });
    res.redirect("/cms/events");
  } catch (err) {
    console.error("Fout bij verwijderen event:", err);
    res.status(500).send("Fout bij verwijderen event");
  }
});

  return router;
}