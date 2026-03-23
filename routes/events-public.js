import express from "express";
import { ObjectId } from "mongodb";

export default function publicEventsRoutes(db) {
  const router = express.Router();

  // Event lijst
  router.get("/", async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await db.collection("events").aggregate([
      { $match: { date: { $gte: today }, status: "gepubliceerd" } },
      {
        $lookup: {
          from: "locations",
          localField: "location",
          foreignField: "_id",
          as: "locationData"
        }
      },
      { $unwind: "$locationData" },
      { $sort: { date: 1 } }
    ]).toArray();

    res.render("events", { events });
  });

  // Event detail
  router.get("/:id", async (req, res) => {
    try {
      const eventId = req.params.id;

      const event = await db.collection("events").aggregate([
        { $match: { _id: new ObjectId(eventId) } },
        {
          $lookup: {
            from: "locations",
            localField: "location",
            foreignField: "_id",
            as: "locationData"
          }
        },
        { $unwind: "$locationData" }
      ]).toArray();

      if (!event.length) {
        return res.status(404).send("Event niet gevonden");
      }

      res.render("evenement", { event: event[0] });

    } catch (err) {
      console.error("Fout bij ophalen event:", err);
      res.status(500).send("Fout bij ophalen event");
    }
  });

  return router;
}
