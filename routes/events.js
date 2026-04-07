import express from "express";
import { ObjectId } from "mongodb";
import { uploadEvent } from "../config/multer.js";

export default function eventsRoutes(db) {
  const router = express.Router();

  // -------------------------------------------------------
  // Middleware (AUTH)
  // -------------------------------------------------------
  function checkAuth(req, res, next) {
    if (!req.session.userId) {
      return res.redirect("/cms/login");
    }
    next();
  }

  // ALLES hieronder is beschermd
  router.use(checkAuth);

  // -------------------------------------------------------
  // GET: Event aanmaken
  // -------------------------------------------------------
  router.get("/createevent", async (req, res) => {
    try {
      const locations = await db.collection("locations").find().toArray();

      res.render("createevent-cms", {
        editMode: false,
        event: null,
        locations,
      });
    } catch (err) {
      console.error("Fout bij ophalen locations:", err);
      res.status(500).send("Fout bij laden pagina");
    }
  });

  // -------------------------------------------------------
  // POST: Event aanmaken
  // -------------------------------------------------------
  router.post(
    "/create",
    uploadEvent.fields([
      { name: "imageSmall", maxCount: 1 },
      { name: "imageLarge", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const { title, date, location, eventLink, lineup, status } = req.body;

        if (!title || !date || !location) {
          return res.status(400).send("Verplichte velden ontbreken");
        }

        const lineupArray = lineup
          ? lineup
              .split(",")
              .map((i) => i.trim())
              .filter(Boolean)
          : [];

        const newEvent = {
          title,
          date: new Date(date),
          location: new ObjectId(location),
          eventLink,
          lineup: lineupArray,
          status: status || "concept",
          createdAt: new Date(),
          imageSmall: req.files?.imageSmall
            ? req.files.imageSmall[0].filename
            : null,
          imageLarge: req.files?.imageLarge
            ? req.files.imageLarge[0].filename
            : null,
        };

        await db.collection("events").insertOne(newEvent);
        res.redirect("/cms/events");
      } catch (err) {
        console.error("Fout bij aanmaken event:", err);
        res.status(500).send("Fout bij aanmaken event");
      }
    },
  );

  // -------------------------------------------------------
  // GET: Event bewerken
  // -------------------------------------------------------
  router.get("/edit/:id", async (req, res) => {
    try {
      const event = await db.collection("events").findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!event) {
        return res.status(404).send("Event niet gevonden");
      }

      const locations = await db.collection("locations").find().toArray();

      res.render("createevent-cms", {
        editMode: true,
        event,
        locations,
      });
    } catch (err) {
      console.error("Fout bij ophalen event:", err);
      res.status(500).send("Fout bij ophalen event");
    }
  });

  // -------------------------------------------------------
  // POST: Event updaten
  // -------------------------------------------------------
  router.post(
    "/edit/:id",
    uploadEvent.fields([
      { name: "imageSmall", maxCount: 1 },
      { name: "imageLarge", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const { title, date, location, eventLink, lineup, status } = req.body;

        if (!title || !date || !location) {
          return res.status(400).send("Verplichte velden ontbreken");
        }

        const lineupArray = lineup
          ? lineup
              .split(",")
              .map((i) => i.trim())
              .filter(Boolean)
          : [];

        const updateData = {
          title,
          date: new Date(date),
          location: new ObjectId(location),
          eventLink,
          lineup: lineupArray,
          status,
        };

        if (req.files?.imageSmall) {
          updateData.imageSmall = req.files.imageSmall[0].filename;
        }

        if (req.files?.imageLarge) {
          updateData.imageLarge = req.files.imageLarge[0].filename;
        }

        await db
          .collection("events")
          .updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData },
          );

        res.redirect("/cms/events");
      } catch (err) {
        console.error("Fout bij updaten event:", err);
        res.status(500).send("Fout bij updaten event");
      }
    },
  );

  // -------------------------------------------------------
  // GET: Events lijst
  // -------------------------------------------------------
  router.get("/", async (req, res) => {
    try {
      const events = await db
        .collection("events")
        .aggregate([
          {
            $lookup: {
              from: "locations",
              localField: "location",
              foreignField: "_id",
              as: "locationData",
            },
          },
          { $unwind: "$locationData" },
        ])
        .toArray();

      res.render("events-cms", { events });
    } catch (err) {
      console.error("Fout bij ophalen events:", err);
      res.status(500).send("Fout bij ophalen events");
    }
  });

  // -------------------------------------------------------
  // DELETE
  // -------------------------------------------------------
  router.post("/delete/:id", async (req, res) => {
    try {
      await db.collection("events").deleteOne({
        _id: new ObjectId(req.params.id),
      });

      res.redirect("/cms/events");
    } catch (err) {
      console.error("Fout bij verwijderen event:", err);
      res.status(500).send("Fout bij verwijderen event");
    }
  });

  return router;
}
