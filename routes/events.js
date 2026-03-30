import express from "express";
import { ObjectId } from "mongodb";
import { uploadEvent } from "../config/multer.js";

export default function eventsRoutes(db) {
  const router = express.Router();

  // -------------------------------------------------------
  // GET: Event aanmaken
  // -------------------------------------------------------
  router.get("/createevent", async (req, res) => {
    const locations = await db.collection("locations").find().toArray();
  
    res.render("createevent-cms", {
      editMode: false,
      event: null,
      locations
    });
  });

  // -------------------------------------------------------
  // POST: Event aanmaken
  // -------------------------------------------------------
  router.post(
    "/create",
    uploadEvent.fields([
      { name: "imageSmall", maxCount: 1 },
      { name: "imageLarge", maxCount: 1 }
    ]),
    async (req, res) => {
      try {
        const { title, date, location, eventLink, lineup, status } = req.body;

        const lineupArray = lineup
          ? lineup.split(",").map(i => i.trim()).filter(Boolean)
          : [];

        const newEvent = {
          title,
          date: new Date(date),
          location: new ObjectId(location),
          eventLink,
          lineup: lineupArray,
          status: status || "concept",
          createdAt: new Date(),
          imageSmall: req.files.imageSmall ? req.files.imageSmall[0].filename : null,
          imageLarge: req.files.imageLarge ? req.files.imageLarge[0].filename : null
        };

        await db.collection("events").insertOne(newEvent);
        res.redirect("/cms/events");
      } catch (err) {
        console.error("Fout bij aanmaken event:", err);
        res.status(500).send("Fout bij aanmaken event");
      }
    }
  );

  // -------------------------------------------------------
  // GET: Event bewerken
  // -------------------------------------------------------
  router.get("/edit/:id", async (req, res) => {
    const event = await db.collection("events").findOne({
      _id: new ObjectId(req.params.id)
    });

    const locations = await db.collection("locations").find().toArray();

    res.render("createevent-cms", {
      editMode: true,
      event,
      locations
    });
  });

  // -------------------------------------------------------
  // POST: Event updaten
  // -------------------------------------------------------
  router.post(
    "/edit/:id",
    uploadEvent.fields([
      { name: "imageSmall", maxCount: 1 },
      { name: "imageLarge", maxCount: 1 }
    ]),
    async (req, res) => {
      try {
        const { title, date, location, eventLink, lineup, status } = req.body;

        const lineupArray = lineup
          ? lineup.split(",").map(i => i.trim()).filter(Boolean)
          : [];

        const updateData = {
          title,
          date: new Date(date),
          location: new ObjectId(location),
          eventLink,
          lineup: lineupArray,
          status
        };

        if (req.files.imageSmall) {
          updateData.imageSmall = req.files.imageSmall[0].filename;
        }
        if (req.files.imageLarge) {
          updateData.imageLarge = req.files.imageLarge[0].filename;
        }

        await db.collection("events").updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updateData }
        );

        res.redirect("/cms/events");
      } catch (err) {
        console.error("Fout bij updaten event:", err);
        res.status(500).send("Fout bij updaten event");
      }
    }
  );


// -------------------------------------------------------
// AJAX SEARCH EVENTS
// -------------------------------------------------------
router.get("/search/ajax", async (req, res) => {
  try {
    const search = req.query.search || "";

    let matchStage = {};

    if (search) {
      matchStage = {
        title: { $regex: search, $options: "i" }
      };
    }

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

    res.json(events);
  } catch (err) {
    console.error("Fout bij AJAX zoeken events:", err);
    res.status(500).json({ error: "Fout bij zoeken" });
  }
});



  // -------------------------------------------------------
  // GET: Events lijst
  // -------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";

    let matchStage = {};

    if (search) {
      matchStage = {
        title: { $regex: search, $options: "i" }
      };
    }

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

    res.render("events-cms", { events, search });
  } catch (err) {
    console.error("Fout bij ophalen events:", err);
    res.status(500).send("Fout bij ophalen events");
  }
});

  // -------------------------------------------------------
  // DELETE
  // -------------------------------------------------------
  router.post("/delete/:id", async (req, res) => {
    await db.collection("events").deleteOne({
      _id: new ObjectId(req.params.id)
    });

    res.redirect("/cms/events");
  });

  return router;
}
