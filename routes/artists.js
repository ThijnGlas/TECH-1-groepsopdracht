import express from "express";
import multer from "multer";
import path from "path";
import { ObjectId } from "mongodb";

export default function artistsRoutes(db) {
  const router = express.Router();

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/uploads/artists/");
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage });

  // --- READ alle artiesten ---
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

  // --- AJAX SEARCH artiesten ---
  router.get("/search/ajax", async (req, res) => {
    const search = req.query.search || "";

    try {
      const artists = await db.collection("artists").find({
        name: { $regex: search, $options: "i" }
      }).sort({ name: 1 }).toArray();

      res.json(artists);
    } catch (err) {
      console.error("Fout bij zoeken artiesten:", err);
      res.status(500).json({ error: "Zoeken mislukt" });
    }
  });

  // --- CREATE artiest ---
  router.post("/create", upload.single("photo"), async (req, res) => {
    try {
      const { name } = req.body;

      if (!name || !req.file) {
        return res.status(400).send("Naam en foto zijn verplicht");
      }

      await db.collection("artists").insertOne({
        name,
        photoPath: "/uploads/artists/" + req.file.filename,
        createdAt: new Date(),
      });

      res.redirect("/cms/artists");
    } catch (err) {
      res.status(500).send("Fout bij aanmaken artiest");
    }
  });

  // --- OPEN edit page ---
  router.get("/edit/:id", async (req, res) => {
    try {
      const artistId = req.params.id;
      const artist = await db.collection("artists").findOne({
        _id: new ObjectId(artistId)
      });

      if (!artist) {
        return res.status(404).send("Artiest niet gevonden");
      }

      res.render("editArtist-cms", { artist });
    } catch (err) {
      console.error("Fout bij openen artiest:", err);
      res.status(500).send("Fout bij openen artiest");
    }
  });

  // --- UPDATE artist ---
  router.post("/edit/:id", upload.single("photo"), async (req, res) => {
    try {
      const artistId = req.params.id;
      const { name } = req.body;

      if (!name) {
        return res.status(400).send("Naam is verplicht");
      }

      const updateFields = { name };

      if (req.file) {
        updateFields.photoPath = "/uploads/artists/" + req.file.filename;
      }

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

  // --- DELETE artist ---
  router.post("/delete/:id", async (req, res) => {
    try {
      const artistId = req.params.id;
      await db.collection("artists").deleteOne({ _id: new ObjectId(artistId) });
      res.redirect("/cms/artists");
    } catch (err) {
      console.error("Fout bij verwijderen artiest:", err);
      res.status(500).send("Fout bij verwijderen artiest");
    }
  });

  return router;
}