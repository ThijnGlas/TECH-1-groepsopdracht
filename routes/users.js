import express from "express";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb"; 

export default function usersRoutes(db) {
  const router = express.Router();

  // --- CREATE user ---
  router.post("/create", async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // simpele validatie
      if (!username || !email || !password) {
        return res.status(400).send("Alle velden zijn verplicht");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        username,
        email,
        password: hashedPassword,
        role: "admin",          // je kunt dit uitbreiden later
        createdAt: new Date(),
      };

      await db.collection("users").insertOne(newUser);

      // redirect naar de users lijst
      res.redirect("/cms/users");
    } catch (err) {
      console.error("Fout bij aanmaken gebruiker:", err);
      res.status(500).send("Fout bij aanmaken gebruiker");
    }
  });

  // --- READ all users ---
  router.get("/", async (req, res) => {
    try {
      const users = await db.collection("users").find().toArray();
      res.render("users-cms", { users }); // stuur users door naar EJS
    } catch (err) {
      console.error("Fout bij ophalen users:", err);
      res.status(500).send("Fout bij ophalen gebruikers");
    }
  });

// --- DELETE user ---
router.post("/delete/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      await db.collection("users").deleteOne({ _id: new ObjectId(userId) });
      res.redirect("/cms/users");
    } catch (err) {
      console.error("Fout bij verwijderen gebruiker:", err);
      res.status(500).send("Fout bij verwijderen gebruiker");
    }
  });

  return router;
}