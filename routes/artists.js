// express is waarmee we de server maken
import express from "express";
// multer gebruiken we om foto's te kunnen uploaden
import multer from "multer";
// path gebruiken we om de bestandsnamen van de foto te kunnen lezen (bv. .jpg of .png)
import path from "path";
// ObjectId hebben we nodig om een artiest op te zoeken via zijn id in de database
import { ObjectId } from "mongodb";

// deze functie maakt alle routes voor artiesten aan en krijgt de database mee
export default function artistsRoutes(db) {
  // router is een kleine express waarmee we routes kunnen maken
  const router = express.Router();

// sla de foto op in de map public/uploads/artists
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/uploads/artists/");
    },
    // geef de foto een unieke naam zodat ze elkaar niet overschrijven
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });

  // multer gebruikt de instellingen hierboven
  const upload = multer({ storage });

  // haal alle artiesten op uit de database en laat de pagina zien
  router.get("/", async (req, res) => {
    try {
      const search = req.query.search || "";
      const artists = await db.collection("artists").find().sort({ name: 1 }).toArray();

      res.render("artists-cms", {
        artists,
        search
      });
    } catch (err) {
      res.status(500).send("Fout bij ophalen artiesten");
    }
  });

  // zoek artiesten op naam, wordt gebruikt voor de zoekbalk
  router.get("/search/ajax", async (req, res) => {
    const search = req.query.search || "";

    try {
      // zoek artiesten waarvan de naam overeenkomt met wat er is ingetypt
      const artists = await db.collection("artists").find({
        name: { $regex: search, $options: "i" }
      }).sort({ name: 1 }).toArray();

      res.json(artists);
    } catch (err) {
      console.error("Fout bij zoeken artiesten:", err);
      res.status(500).json({ error: "Zoeken mislukt" });
    }
  });

  // sla een nieuwe artiest op in de database met naam en foto
  router.post("/create", upload.single("photo"), async (req, res) => {
    try {
      const { name } = req.body;

      // controleer of naam en foto zijn ingevuld
      if (!name || !req.file) {
        return res.status(400).send("Naam en foto zijn verplicht");
      }

      // zet de artiest in de database
      await db.collection("artists").insertOne({
        name,
        photoPath: "/uploads/artists/" + req.file.filename,
        createdAt: new Date(),
      });

      // ga terug naar de artiesten pagina
      res.redirect("/cms/artists");
    } catch (err) {
      res.status(500).send("Fout bij aanmaken artiest");
    }
  });

  // open de bewerkpagina van een artiest
  router.get("/edit/:id", async (req, res) => {
    try {
      const artistId = req.params.id;

      // zoek de artiest op via zijn id
      const artist = await db.collection("artists").findOne({
        _id: new ObjectId(artistId)
      });

      // als de artiest niet bestaat geef een foutmelding
      if (!artist) {
        return res.status(404).send("Artiest niet gevonden");
      }

      res.render("editArtist-cms", { artist });
    } catch (err) {
      console.error("Fout bij openen artiest:", err);
      res.status(500).send("Fout bij openen artiest");
    }
  });

  // sla de wijzigingen op van een artiest
  router.post("/edit/:id", upload.single("photo"), async (req, res) => {
    try {
      const artistId = req.params.id;
      const { name } = req.body;

      if (!name) {
        return res.status(400).send("Naam is verplicht");
      }

      // begin met alleen de naam te updaten
      const updateFields = { name };

      // als er een nieuwe foto is geüpload, ook de foto updaten
      if (req.file) {
        updateFields.photoPath = "/uploads/artists/" + req.file.filename;
      }

      // sla de wijzigingen op in de database
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

  // verwijder een artiest uit de database
  router.post("/delete/:id", async (req, res) => {
    try {
      const artistId = req.params.id;

      // zoek de artiest op via zijn id en verwijder hem
      await db.collection("artists").deleteOne({ _id: new ObjectId(artistId) });
      res.redirect("/cms/artists");
    } catch (err) {
      console.error("Fout bij verwijderen artiest:", err);
      res.status(500).send("Fout bij verwijderen artiest");
    }
  });

  return router;
}