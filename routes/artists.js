import express from "express";
import multer from "multer";
import path from "path";
import { ObjectId } from "mongodb";

export default function artistsRoutes(db) {
  const router = express.Router();

  // controleren of de gebruiker is ingelogd, zo niet stuur hem dan door naar de loginpagina
  function checkAuth(req, res, next) {
    if (!req.session.userId) {
      return res.redirect("/cms/login");
    }
    next();
  }

  // multer instellen om geüploade foto's op te slaan in de artists map
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/uploads/artists/");
    },
    // unieke bestandsnaam aanmaken zodat bestanden elkaar niet overschrijven
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });

  const upload = multer({ storage });

  // alle artiesten ophalen en weergeven, alfabetisch gesorteerd
  router.get("/", checkAuth, async (req, res) => {
    try {
      const search = req.query.search || "";
      const artists = await db.collection("artists").find().sort({ name: 1 }).toArray();
      res.render("artists-cms", { artists, search });
    } catch (err) {
      console.error("Fout bij ophalen artiesten:", err);
      res.status(500).send("Fout bij ophalen artiesten");
    }
  });

  // ajax route voor de zoekfunctie, geeft resultaten terug als json
  router.get("/search/ajax", checkAuth, async (req, res) => {
    const search = req.query.search || "";
    try {
      // zoeken op naam van de artiest, hoofdletterongevoelig
      const artists = await db.collection("artists").find({
        name: { $regex: search, $options: "i" }
      }).sort({ name: 1 }).toArray();
      res.json(artists);
    } catch (err) {
      console.error("Fout bij zoeken artiesten:", err);
      res.status(500).json({ error: "Zoeken mislukt" });
    }
  });

  // artiest aanmaken, upload.single pakt één foto uit het formulier
  router.post("/create", checkAuth, upload.single("photo"), async (req, res) => {
    try {
      const { name } = req.body;

      // naam en foto zijn beide verplicht
      if (!name || !req.file) {
        return res.status(400).send("Naam en foto zijn verplicht");
      }

      // artiest opslaan in de database
      await db.collection("artists").insertOne({
        name,
        photoPath: "/uploads/artists/" + req.file.filename,
        createdAt: new Date(),
      });

      res.redirect("/cms/artists");
    } catch (err) {
      console.error("Fout bij aanmaken artiest:", err);
      res.status(500).send("Fout bij aanmaken artiest");
    }
  });

  // edit formulier ophalen voor de gekozen artiest
  router.get("/edit/:id", checkAuth, async (req, res) => {
    try {
      const artistId = req.params.id;

      // artiest zoeken op id
      const artist = await db.collection("artists").findOne({
        _id: new ObjectId(req.params.id),
      });

      // check om te zien of de artiest bestaat, zo niet stuurt hij je een 404 error
      if (!artist) {
        return res.status(404).send("Artiest niet gevonden");
      }

      // formulier invullen met de bestaande gegevens van de artiest
      res.render("editArtist-cms", { artist });
    } catch (err) {
      console.error("Fout bij openen artiest:", err);
      res.status(500).send("Fout bij openen artiest");
    }
  });

  // artiest updaten, pakt de nieuwe gegevens uit het formulier
  router.post("/edit/:id", checkAuth, upload.single("photo"), async (req, res) => {
    try {
      const { name } = req.body;

      // naam is verplicht
      if (!name) {
        return res.status(400).send("Naam is verplicht");
      }

      const updateFields = { name };

      // foto alleen updaten als er een nieuwe geüpload is
      // anders houden we de oude foto
      if (req.file) {
        updateFields.photoPath = "/uploads/artists/" + req.file.filename;
      }

      // artiest updaten in de database met $set, zodat alleen de gewijzigde velden worden aangepast
      await db.collection("artists").updateOne(
        { _id: new ObjectId(artistId) },
        { $set: updateFields }
      );

      res.redirect("/cms/artists");
    } catch (err) {
      console.error("Fout bij wijzigen artiest:", err);
      res.status(500).send("Fout bij wijzigen artiest");
    }
  });

  // artiest verwijderen op basis van id
  router.post("/delete/:id", checkAuth, async (req, res) => {
    try {
      const artistId = req.params.id;

      // artiest verwijderen uit de database
      await db.collection("artists").deleteOne({ _id: new ObjectId(artistId) });
      res.redirect("/cms/artists");
    } catch (err) {
      console.error("Fout bij verwijderen artiest:", err);
      res.status(500).send("Fout bij verwijderen artiest");
    }
  });

  return router;
}
