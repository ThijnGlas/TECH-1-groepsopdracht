import express from "express";
import multer from "multer";
import path from "path";
import { ObjectId } from "mongodb";

export default function artistsRoutes(db) {
  const router = express.Router();

<<<<<<< HEAD
  // controleren of de gebruiker is ingelogd, zo niet stuur hem dan door naar de loginpagina
=======
  // -------------------------------------------------------
  // 🔐 Middleware (AUTH)
  // -------------------------------------------------------
>>>>>>> df3f8cf8cc0082cc424d2dce3d43816e3552019f
  function checkAuth(req, res, next) {
    if (!req.session.userId) {
      return res.redirect("/cms/login");
    }
    next();
  }

<<<<<<< HEAD
  // multer instellen om geüploade foto's op te slaan in de artists map
=======
  // 👉 alles beschermen
  router.use(checkAuth);

  // -------------------------------------------------------
  // Multer config
  // -------------------------------------------------------
>>>>>>> df3f8cf8cc0082cc424d2dce3d43816e3552019f
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

<<<<<<< HEAD
  // alle artiesten ophalen en weergeven, alfabetisch gesorteerd
  router.get("/", checkAuth, async (req, res) => {
    try {
      const search = req.query.search || "";
      const artists = await db.collection("artists").find().sort({ name: 1 }).toArray();
      res.render("artists-cms", { artists, search });
=======
  // -------------------------------------------------------
  // READ alle artiesten
  // -------------------------------------------------------
  router.get("/", async (req, res) => {
    try {
      const search = req.query.search || "";

      const query = search ? { name: { $regex: search, $options: "i" } } : {};

      const artists = await db
        .collection("artists")
        .find(query)
        .sort({ name: 1 })
        .toArray();

      res.render("artists-cms", {
        artists,
        search,
      });
>>>>>>> df3f8cf8cc0082cc424d2dce3d43816e3552019f
    } catch (err) {
      console.error("Fout bij ophalen artiesten:", err);
      res.status(500).send("Fout bij ophalen artiesten");
    }
  });

<<<<<<< HEAD
  // ajax route voor de zoekfunctie, geeft resultaten terug als json
  router.get("/search/ajax", checkAuth, async (req, res) => {
    const search = req.query.search || "";
    try {
      // zoeken op naam van de artiest, hoofdletterongevoelig
      const artists = await db.collection("artists").find({
        name: { $regex: search, $options: "i" }
      }).sort({ name: 1 }).toArray();
=======
  // -------------------------------------------------------
  // AJAX SEARCH
  // -------------------------------------------------------
  router.get("/search/ajax", async (req, res) => {
    try {
      const search = req.query.search || "";

      const artists = await db
        .collection("artists")
        .find({
          name: { $regex: search, $options: "i" },
        })
        .sort({ name: 1 })
        .toArray();

>>>>>>> df3f8cf8cc0082cc424d2dce3d43816e3552019f
      res.json(artists);
    } catch (err) {
      console.error("Fout bij zoeken artiesten:", err);
      res.status(500).json({ error: "Zoeken mislukt" });
    }
  });

<<<<<<< HEAD
  // artiest aanmaken, upload.single pakt één foto uit het formulier
  router.post("/create", checkAuth, upload.single("photo"), async (req, res) => {
=======
  // -------------------------------------------------------
  // CREATE artiest
  // -------------------------------------------------------
  router.post("/create", upload.single("photo"), async (req, res) => {
>>>>>>> df3f8cf8cc0082cc424d2dce3d43816e3552019f
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

<<<<<<< HEAD
  // edit formulier ophalen voor de gekozen artiest
  router.get("/edit/:id", checkAuth, async (req, res) => {
    try {
      const artistId = req.params.id;

      // artiest zoeken op id
=======
  // -------------------------------------------------------
  // OPEN edit page
  // -------------------------------------------------------
  router.get("/edit/:id", async (req, res) => {
    try {
>>>>>>> df3f8cf8cc0082cc424d2dce3d43816e3552019f
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

<<<<<<< HEAD
  // artiest updaten, pakt de nieuwe gegevens uit het formulier
  router.post("/edit/:id", checkAuth, upload.single("photo"), async (req, res) => {
=======
  // -------------------------------------------------------
  // UPDATE artist
  // -------------------------------------------------------
  router.post("/edit/:id", upload.single("photo"), async (req, res) => {
>>>>>>> df3f8cf8cc0082cc424d2dce3d43816e3552019f
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

<<<<<<< HEAD
      // artiest updaten in de database met $set, zodat alleen de gewijzigde velden worden aangepast
      await db.collection("artists").updateOne(
        { _id: new ObjectId(artistId) },
        { $set: updateFields }
      );
=======
      await db
        .collection("artists")
        .updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updateFields },
        );
>>>>>>> df3f8cf8cc0082cc424d2dce3d43816e3552019f

      res.redirect("/cms/artists");
    } catch (err) {
      console.error("Fout bij wijzigen artiest:", err);
      res.status(500).send("Fout bij wijzigen artiest");
    }
  });

<<<<<<< HEAD
  // artiest verwijderen op basis van id
  router.post("/delete/:id", checkAuth, async (req, res) => {
    try {
      const artistId = req.params.id;

      // artiest verwijderen uit de database
      await db.collection("artists").deleteOne({ _id: new ObjectId(artistId) });
=======
  // -------------------------------------------------------
  // DELETE artist
  // -------------------------------------------------------
  router.post("/delete/:id", async (req, res) => {
    try {
      await db.collection("artists").deleteOne({
        _id: new ObjectId(req.params.id),
      });

>>>>>>> df3f8cf8cc0082cc424d2dce3d43816e3552019f
      res.redirect("/cms/artists");
    } catch (err) {
      console.error("Fout bij verwijderen artiest:", err);
      res.status(500).send("Fout bij verwijderen artiest");
    }
  });

  return router;
}
