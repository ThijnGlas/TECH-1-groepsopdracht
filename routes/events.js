import express from "express";
import { ObjectId } from "mongodb";
import { uploadEvent } from "../config/multer.js";

export default function eventsRoutes(db) {
  const router = express.Router();

  // controleren of de gebruiker is ingelogd, zo niet stuur hem dan door naar de loginpagina
  function checkAuth(req, res, next) {
    if (!req.session.userId) {
      return res.redirect("/cms/login");
    }
    next();
  }

  // formulier ophalen om een nieuw event aan te maken
  router.get("/createevent", checkAuth, async (req, res) => {
    // locaties ophalen zodat je die kan kiezen in het formulier
    const locations = await db.collection("locations").find().toArray();

    res.render("createevent-cms", {
      editMode: false,
      event: null,
      locations
    });
  });

  // nieuw event opslaan in de database
  // uploadEvent.fields zorgt ervoor dat je meerdere afbeeldingen tegelijk kan uploaden
  router.post(
    "/create",
    checkAuth,
    uploadEvent.fields([
      { name: "imageSmall", maxCount: 1 },
      { name: "imageLarge", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        // gegevens uit het formulier halen
        const { title, date, location, eventLink, lineup, status } = req.body;

        // lineup is een string die word gescheiden met een komma, dus die splits ik op naar een array
        // filter zorgt ervoor dat lege strings er niet in komen
        const lineupArray = lineup
          ? lineup
              .split(",")
              .map((i) => i.trim())
              .filter(Boolean)
          : [];

        // nieuw event object aanmaken
        const newEvent = {
          title,
          date: new Date(date),
          location: new ObjectId(location), // string omzetten naar MongoDB ObjectId
          eventLink,
          lineup: lineupArray,
          status: status || "concept", // als er geen status is, concept als standaard gebruiken
          createdAt: new Date(),
          // afbeelding opslaan als die geüpload is, anders null
          imageSmall: req.files.imageSmall ? req.files.imageSmall[0].filename : null,
          imageLarge: req.files.imageLarge ? req.files.imageLarge[0].filename : null
        };

        // event opslaan in de database
        await db.collection("events").insertOne(newEvent);

        // na het aanmaken van het event, terug naar de events pagina
        res.redirect("/cms/events");
      } catch (err) {
        console.error("Fout bij aanmaken event:", err);
        res.status(500).send("Fout bij aanmaken event");
      }
    },
  );

  // edit formulier ophalen voor het gekozen event
  router.get("/edit/:id", checkAuth, async (req, res) => {
    // event ophalen uit de database op basis van het id in de url
    const event = await db.collection("events").findOne({
      _id: new ObjectId(req.params.id)
    });

    // locaties ophalen zodat je die kan kiezen in het formulier
    const locations = await db.collection("locations").find().toArray();

    // formulier invullen met de bestaande gegevens van het event, zodat je deze kan aanpassen
    res.render("createevent-cms", {
      editMode: true,
      event,
      locations
    });
  });

  // gewijzigde gegevens opslaan in de database
  // uploadEvent.fields zorgt ervoor dat je meerdere afbeeldingen tegelijk kan uploaden
  router.post(
    "/edit/:id",
    checkAuth,
    uploadEvent.fields([
      { name: "imageSmall", maxCount: 1 },
      { name: "imageLarge", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        // gegevens uit het formulier halen
        const { title, date, location, eventLink, lineup, status } = req.body;

        // lineup weer omzetten naar een array, zelfde als bij aanmaken
        const lineupArray = lineup
          ? lineup
              .split(",")
              .map((i) => i.trim())
              .filter(Boolean)
          : [];

        // object aanmaken met de gegevens die we willen updaten
        const updateData = {
          title,
          date: new Date(date),
          location: new ObjectId(location),
          eventLink,
          lineup: lineupArray,
          status,
        };

        // afbeeldingen alleen updaten als er nieuwe geüpload zijn
        // anders houden we de oude afbeeldingen
        if (req.files.imageSmall) {
          updateData.imageSmall = req.files.imageSmall[0].filename;
        }

        if (req.files?.imageLarge) {
          updateData.imageLarge = req.files.imageLarge[0].filename;
        }

        // event updaten in de database met $set, zodat alleen de gewijzigde velden worden aangepast
        await db.collection("events").updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updateData }
        );

        // na het updaten van het event, terug naar de events pagina
        res.redirect("/cms/events");
      } catch (err) {
        console.error("Fout bij updaten event:", err);
        res.status(500).send("Fout bij updaten event");
      }
    },
  );

  // ajax route voor de zoekfunctie, geeft resultaten terug als json
  router.get("/search/ajax", checkAuth, async (req, res) => {
    try {
      const search = req.query.search || "";

      // als er niks ingevuld is, alle events teruggeven
      let matchStage = {};

      // zoeken op titel van het event
      if (search) {
        matchStage = {
          title: { $regex: search, $options: "i" } // i = hoofdletterongevoelig
        };
      }

      // aggregate gebruiken zodat we ook de locatiegegevens erbij kunnen ophalen
      const events = await db.collection("events").aggregate([
        {
          // locatie koppelen aan het event via het location id
          $lookup: {
            from: "locations",
            localField: "location",
            foreignField: "_id",
            as: "locationData"
          }
        },
        // locationData is een array, unwind maakt er een object van
        { $unwind: "$locationData" },
        // zoekfilter toepassen
        { $match: matchStage }
      ]).toArray();

      // resultaten terugsturen als json
      res.json(events);
    } catch (err) {
      console.error("Fout bij AJAX zoeken events:", err);
      res.status(500).json({ error: "Fout bij zoeken" });
    }
  });

  // alle events ophalen en weergeven, met optionele zoekfunctie
  router.get("/", checkAuth, async (req, res) => {
    try {
      const search = req.query.search || "";

      // als er niks ingevuld is, alle events teruggeven
      let matchStage = {};

      if (search) {
        matchStage = {
          title: { $regex: search, $options: "i" }
        };
      }

      // zelfde aggregate als bij de zoekroute
      const events = await db.collection("events").aggregate([
        {
          $lookup: {
            from: "locations",
            localField: "location",
            foreignField: "_id",
            as: "locationData"
          }
        },
        { $unwind: "$locationData" },
        { $match: matchStage }
      ]).toArray();

      // events en de zoekterm meegeven aan de view
      res.render("events-cms", { events, search });
    } catch (err) {
      console.error("Fout bij ophalen events:", err);
      res.status(500).send("Fout bij ophalen events");
    }
  });

  // event verwijderen op basis van id
  router.post("/delete/:id", checkAuth, async (req, res) => {
    await db.collection("events").deleteOne({
      _id: new ObjectId(req.params.id)
    });

      res.redirect("/cms/events");
    } catch (err) {
      console.error("Fout bij verwijderen event:", err);
      res.status(500).send("Fout bij verwijderen event");
    }
  });

  return router;
}