import express from "express";
import { ObjectId } from "mongodb";

export default function locationsRoutes(db) {
  const router = express.Router();

  // --- CREATE location ---
  router.post("/create", async (req, res) => {
    try {
      const { name, address, city, capacity } = req.body;

      if (!name || !address || !city || !capacity) {
        return res.status(400).send("Alle velden zijn verplicht");
      }

      const newLocation = {
        name,
        address,
        city,
        capacity: Number(capacity),
        createdAt: new Date(),
      };

      await db.collection("locations").insertOne(newLocation);
      res.redirect("/cms/locations");
    } catch (err) {
      console.error("Fout bij aanmaken locatie:", err);
      res.status(500).send("Fout bij aanmaken locatie");
    }
  });

  // --- READ all locations ---
  router.get("/", async (req, res) => {
    try {
      const search = req.query.search || "";
      let query = {};

      if (search) {
        query = {
          name: { $regex: search, $options: "i" }
        };
      }

      const locations = await db.collection("locations").find(query).toArray();
      res.render("locations-cms", { locations, search });
    } catch (err) {
      console.error("Fout bij ophalen locaties:", err);
      res.status(500).send("Fout bij ophalen locaties");
    }
  });

  // --- OPEN edit page ---
  router.get("/edit/:id", async (req, res) => {
    try {
      const locationId = req.params.id;
      const location = await db.collection("locations").findOne({
        _id: new ObjectId(locationId)
      });

      if (!location) {
        return res.status(404).send("Locatie niet gevonden");
      }

      res.render("editLocation-cms", { location });
    } catch (err) {
      console.error("Fout bij openen locatie:", err);
      res.status(500).send("Fout bij openen locatie");
    }
  });

  // --- UPDATE location ---
  router.post("/edit/:id", async (req, res) => {
    try {
      const locationId = req.params.id;
      const { name, address, city, capacity } = req.body;

      if (!name || !address || !city || !capacity) {
        return res.status(400).send("Alle velden zijn verplicht");
      }

      await db.collection("locations").updateOne(
        { _id: new ObjectId(locationId) },
        {
          $set: {
            name,
            address,
            city,
            capacity: Number(capacity),
          }
        }
      );

      res.redirect("/cms/locations");
    } catch (err) {
      console.error("Fout bij wijzigen locatie:", err);
      res.status(500).send("Fout bij wijzigen locatie");
    }
  });

  // --- DELETE location ---
  router.post("/delete/:id", async (req, res) => {
    try {
      const locationId = req.params.id;
      await db.collection("locations").deleteOne({ _id: new ObjectId(locationId) });
      res.redirect("/cms/locations");
    } catch (err) {
      console.error("Fout bij verwijderen locatie:", err);
      res.status(500).send("Fout bij verwijderen locatie");
    }
  });

  return router;
}