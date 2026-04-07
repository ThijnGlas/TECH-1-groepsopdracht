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

    // Hier lezen we de gekozen filters uit de URL.
    // Voorbeeld: /events?location=Amsterdam&month=7
    // Als de gebruiker niets kiest, blijft de waarde leeg.
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

    // We starten met alle events die uit de database komen.
    // Daarna halen we stap voor stap events weg die niet aan de filters voldoen.
    let filteredEvents = events;

    // Alleen als de gebruiker een locatie kiest, filteren we op stad.
    // "All" betekent: geen filter toepassen, dus alles laten staan.
    if (selectedLocation && selectedLocation !== "All") {
      filteredEvents = filteredEvents.filter(event =>
        // Controleert of het event een stad heeft
        // en vergelijkt die stad met de gekozen locatie
        event.locationData.city &&
        event.locationData.city.toLowerCase() === selectedLocation.toLowerCase()
      );
    }

    // Daarna doen we hetzelfde voor de maand.
    // Als de gebruiker een maand kiest, houden we alleen events uit die maand over.
    // getMonth() geeft 0 t/m 11 terug, daarom doen we +1.
    if (selectedMonth && selectedMonth !== "All") {
      filteredEvents = filteredEvents.filter(event => {
        // Haalt het maandnummer uit de eventdatum
        const eventMonth = new Date(event.date).getMonth() + 1;

        // Vergelijkt de maand van het event met de gekozen maand uit de URL
        return eventMonth === Number(selectedMonth);
      });
    }

    // hier halen we alle unieke steden uit de locations collectie
    // distinct zorgt ervoor dat elke stad maar 1 keer voorkomt
    const cities = await db.collection("locations").distinct("city");

    // lege waardes eruit halen en alfabetisch sorteren
    const filteredCities = cities
      .filter(city => city && city.trim() !== "")
      .sort((a, b) => a.localeCompare(b));

    // gefilterde events, geselecteerde filters en steden meegeven aan de view
    res.render("events", {
      events: filteredEvents,
      selectedLocation,
      selectedMonth,
      cities: filteredCities
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
