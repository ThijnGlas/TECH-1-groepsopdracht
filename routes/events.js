import express from "express";
import { ObjectId } from "mongodb";
import { uploadEvent } from "../config/multer.js";

export default function eventsRoutes(db) {
  // router aanmaken
  const router = express.Router();


  // GET: Event aanmaken  
  // formulier ophalen om een nieuw event aan te maken
  router.get("/createevent", async (req, res) => {

    // locaties ophalen zodat je die kan kiezen in het formulier
    const locations = await db.collection("locations").find().toArray();

    res.render("createevent-cms", {
      editMode: false,
      event: null,
      locations
    });
  });

  // POST: Event aanmaken
  // nieuw event opslaan in de database
  // uploadEvent.fields zorgt ervoor dat je meerdere afbeeldingen tegelijk kan uploaden
  router.post(
    "/create",
    uploadEvent.fields([
      { name: "imageSmall", maxCount: 1 },
      { name: "imageLarge", maxCount: 1 }
    ]),
    async (req, res) => {
      try {
        // gegevens uit het formulier halen
        const { title, date, location, eventLink, lineup, status } = req.body;

        // lineup is een string die word gescheiden met een komma, dus die splits ik op naar een array
        // filter zorgt ervoor dat lege strings er niet in komen
        const lineupArray = lineup
          ? lineup.split(",").map(i => i.trim()).filter(Boolean)
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
    }
  );


  // GET: Event bewerken

  // edit formulier ophalen voor het gekozen event
  router.get("/edit/:id", async (req, res) => {
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


  // POST: Event updaten
  // gewijzigde gegevens opslaan in de database
  router.post(
    "/edit/:id",
    uploadEvent.fields([
      { name: "imageSmall", maxCount: 1 },
      { name: "imageLarge", maxCount: 1 }
    ]),
    async (req, res) => {
      try {
        // gegevens uit het formulier halen
        const { title, date, location, eventLink, lineup, status } = req.body;

        // lineup weer omzetten naar een array, zelfde als bij aanmaken
        const lineupArray = lineup
          ? lineup.split(",").map(i => i.trim()).filter(Boolean)
          : [];

        // object aanmaken met de gegevens die we willen updaten
        const updateData = {
          title,
          date: new Date(date),
          location: new ObjectId(location),
          eventLink,
          lineup: lineupArray,
          status
        };

        // afbeeldingen alleen updaten als er nieuwe geüpload zijn
        // anders houden we de oude afbeeldingen
        if (req.files.imageSmall) {
          updateData.imageSmall = req.files.imageSmall[0].filename;
        }
        if (req.files.imageLarge) {
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
    }
  );



  // AJAX SEARCH EVENTS gemaakt door Tin Phan ;D
  router.get("/search/ajax", async (req, res) => {
    try {
      //Haalt de zoekterm uit de querystring, bv. /search/ajax?search=rock
      //Als er niets is ingevuld, gebruiken we een lege string
      const search = req.query.search || "";

      // Standaard geen filter: dan geven we alle events terug
      let matchStage = {};

      //Als de gebruiker iets heeft ingevuld, filteren we op de titel van het event
      if (search) {
        matchStage = {
          // Zoekt gedeeltelijk op titel, zonder onderscheid tussen hoofdletters en kleine letters
          title: { $regex: search, $options: "i" } 
        };
      }

      // We gebruiken aggregate omdat we niet alleen de events willen ophalen,
      // maar ook extra locatiegegevens uit de locations-collectie willen koppelen.
      // Met deze pipeline kunnen we dus een soort join doen en daarna het resultaat filteren.
      const events = await db.collection("events").aggregate([
        // zoekfilter toepassen
        { $match: matchStage },
        {
          // locatie koppelen aan het event via het location id
          $lookup: {
            from: "locations",  
            localField: "location",
            foreignField: "_id",
            as: "locationData"
          }
        },
        // locationData is een array, unwind maakt er een object van,
        // dit doen we omdat het dan makkelijker en netter is om mee te werken
        { $unwind: "$locationData" },
      ]).toArray(); 

      // resultaten terugsturen als json
      res.json(events);
    } catch (err) {
      console.error("Fout bij AJAX zoeken events:", err);
      res.status(500).json({ error: "Fout bij zoeken" });
    }
  });




  // GET: Events lijst
  // alle events ophalen en weergeven, met optionele zoekfunctie
  router.get("/", async (req, res) => {
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


  // DELETE
  // event verwijderen op basis van id
  router.post("/delete/:id", async (req, res) => {
    await db.collection("events").deleteOne({
      _id: new ObjectId(req.params.id)
    });

    res.redirect("/cms/events");
  });

  return router;
}
