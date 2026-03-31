import express from "express";
import { ObjectId } from "mongodb";

export default function publicEventsRoutes(db) {
  // router aanmaken voor de publieke eventpagina
  const router = express.Router();

  // alle gepubliceerde events ophalen voor de eventspagina
  router.get("/", async (req, res) => {

    // datum van vandaag aanmaken en de tijd op middernacht zetten
    // zo laten we events van vandaag nog wel zien
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // filter opties uit de url halen, leeg als er niks geselecteerd is
    const selectedLocation = req.query.location || "";
    const selectedMonth = req.query.month || "";

    // alleen toekomstige gepubliceerde events ophalen, gesorteerd op datum
    const events = await db.collection("events").aggregate([
      // alleen events ophalen die vandaag of later zijn en gepubliceerd zijn
      { $match: { date: { $gte: today }, status: "gepubliceerd" } },
      {
        // locatiegegevens koppelen aan het event
        $lookup: {
          from: "locations",
          localField: "location",
          foreignField: "_id",
          as: "locationData"
        }
      },
      // locationData omzetten van array naar object
      { $unwind: "$locationData" },
      // oudste events bovenaan
      { $sort: { date: 1 } }
    ]).toArray();

    // filteren gebeurt in javascript omdat je anders twee keer een aggregate query moet doen
    let filteredEvents = events;

    // filteren op stad als er een locatie geselecteerd is
    if (selectedLocation && selectedLocation !== "All") {
      filteredEvents = filteredEvents.filter(event =>
        event.locationData.city &&
        event.locationData.city.toLowerCase() === selectedLocation.toLowerCase()
      );
    }

    // filteren op maand als er een maand geselecteerd is
    // getMonth() geeft 0-11 terug, dus +1 om het gelijk te maken aan de echte maandnummers
    if (selectedMonth && selectedMonth !== "All") {
      filteredEvents = filteredEvents.filter(event => {
        const eventMonth = new Date(event.date).getMonth() + 1;
        return eventMonth === Number(selectedMonth);
      });
    }

    // gefilterde events en de geselecteerde filterwaarden meegeven aan de view
    res.render("events", {
      events: filteredEvents,
      selectedLocation,
      selectedMonth
    });
  });

  // event detailpagina van een event ophalen
  router.get("/:id", async (req, res) => {
    try {
      // id uit de url halen
      const eventId = req.params.id;

      // event ophalen met de bijbehorende locatiegegevens
      const event = await db.collection("events").aggregate([
        // alleen het event ophalen met het opgegeven id
        { $match: { _id: new ObjectId(eventId) } },
        {
          // locatiegegevens koppelen aan het event
          $lookup: {
            from: "locations",
            localField: "location",
            foreignField: "_id",
            as: "locationData"
          }
        },
        // locationData omzetten van array naar object
        { $unwind: "$locationData" }
      ]).toArray();

      // aggregate geeft altijd een array terug, dus checken of het event bestaat
      if (!event.length) {
        return res.status(404).send("Event niet gevonden");
      }

      // event[0] omdat aggregate een array teruggeeft maar we maar één event verwachten
      res.render("evenement", { event: event[0] });
    } catch (err) {
      console.error("Fout bij ophalen event:", err);
      res.status(500).send("Fout bij ophalen event");
    }
  });

  return router;
}