import express from "express";

// export een functie zodat we de database (db) kunnen gebruiken
export default function preregisterRoutes(db) {
  const router = express.Router(); // maak een nieuwe router aan

  // --- POST pre-register ---
  router.post("/", async (req, res) => {
    try {
      // haal email uit het formulier (req.body)
      let { email } = req.body;

      // maak email netjes (spaties weg + kleine letters)
      email = email.trim().toLowerCase();

      // check of deze email al in de database staat
      const existing = await db.collection("preregister").findOne({ email });

      // als email al bestaat → terug naar pagina met error
      if (existing) {
        return res.redirect("/pre-register?error=1");
      }

      // sla nieuwe email op in de database
      await db.collection("preregister").insertOne({
        email,
        createdAt: new Date(), // datum wanneer iemand zich registreert
      });

      // stuur gebruiker terug met succes melding
      res.redirect("/pre-register?success=1");
    } catch (err) {
      // als er iets fout gaat → error in console + terug naar pagina
      console.error(err);
      res.redirect("/pre-register?error=1");
    }
  });

  return router; // geef de router terug zodat server.js hem kan gebruiken
}
