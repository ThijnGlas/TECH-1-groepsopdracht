import express from "express";
import { ObjectId } from "mongodb";

export default function locationsRoutes(db) {
  const router = express.Router();

  // controleren of de gebruiker is ingelogd, zo niet stuur hem dan door naar de loginpagina
  function checkAuth(req, res, next) {
    if (!req.session.userId) {
      return res.redirect("/cms/login");
    }
    next();
  }

  // locatie aanmaken, pakt de gegevens uit het formulier
  router.post("/create", checkAuth, async (req, res) => {
    try {
      const { name, address, city, capacity, mapsLink } = req.body;

      // controleren of alle verplichte velden zijn ingevuld
      if (!name || !address || !city || !capacity) {
        return res.status(400).send("Alle velden zijn verplicht");
      }

      // nieuw locatie object aanmaken
      const newLocation = {
        name,
        address,
        city,
        capacity: Number(capacity),
        mapsLink: mapsLink || "",
        createdAt: new Date(),
      };

      // locatie opslaan in de database
      await db.collection("locations").insertOne(newLocation);
      res.redirect("/cms/locations");
    } catch (err) {
      console.error("Fout bij aanmaken locatie:", err);
      res.status(500).send("Fout bij aanmaken locatie");
    }
  });

  // ajax route voor de zoekfunctie, geeft resultaten terug als json
  router.get("/search/ajax", checkAuth, async (req, res) => {
    try {
      const search = req.query.search || "";

      // als er niks ingevuld is, alle locaties teruggeven
      let query = {};

      // zoeken op naam van de locatie
      if (search) {
        query = {
          name: { $regex: search, $options: "i" },
        };
      }

      const locations = await db.collection("locations").find(query).toArray();
      res.json(locations);
    } catch (err) {
      console.error("Fout bij AJAX zoeken locaties:", err);
      res.status(500).json({ error: "Fout bij zoeken" });
    }
  });

  // alle locaties ophalen en weergeven
  router.get("/", checkAuth, async (req, res) => {
    try {
      const search = req.query.search || "";

      // als er niks ingevuld is, alle locaties teruggeven
      let query = {};

      // zoeken op naam van de locatie
      if (search) {
        query = {
          name: { $regex: search, $options: "i" },
        };
      }

      const locations = await db.collection("locations").find(query).toArray();
      res.render("locations-cms", { locations, search });
    } catch (err) {
      console.error("Fout bij ophalen locaties:", err);
      res.status(500).send("Fout bij ophalen locaties");
    }
  });

  // edit formulier ophalen voor de gekozen locatie
  router.get("/edit/:id", checkAuth, async (req, res) => {
    try {

      // locatie zoeken op id
      const location = await db.collection("locations").findOne({
        _id: new ObjectId(req.params.id),
      });

      // check om te zien of de locatie bestaat, zo niet stuurt hij je een 404 error
      if (!location) {
        return res.status(404).send("Locatie niet gevonden");
      }

      // formulier invullen met de bestaande gegevens van de locatie
      res.render("editLocation-cms", { location });
    } catch (err) {
      console.error("Fout bij openen locatie:", err);
      res.status(500).send("Fout bij openen locatie");
    }
  });

  // locatie updaten, pakt de nieuwe gegevens uit het formulier
  router.post("/edit/:id", checkAuth, async (req, res) => {
    try {
      const { name, address, city, capacity, mapsLink } = req.body;

      // controleren of alle verplichte velden zijn ingevuld
      if (!name || !address || !city || !capacity) {
        return res.status(400).send("Alle velden zijn verplicht");
      }

      // locatie updaten in de database met $set, zodat alleen de gewijzigde velden worden aangepast
      await db.collection("locations").updateOne(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            name,
            address,
            city,
            capacity: Number(capacity),
            mapsLink: mapsLink || "",
          },
        },
      );

      // na het updaten terug naar de locaties pagina
      res.redirect("/cms/locations");
    } catch (err) {
      console.error("Fout bij wijzigen locatie:", err);
      res.status(500).send("Fout bij wijzigen locatie");
    }
  });

  // locatie verwijderen op basis van id
  router.post("/delete/:id", checkAuth, async (req, res) => {
    try {

      // locatie verwijderen uit de database
      await db.collection("locations").deleteOne({
        _id: new ObjectId(req.params.id),
      });

      // na het verwijderen terug naar de locaties pagina
      res.redirect("/cms/locations");
    } catch (err) {
      console.error("Fout bij verwijderen locatie:", err);
      res.status(500).send("Fout bij verwijderen locatie");
    }
  });

  return router;
}
