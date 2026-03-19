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
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: "admin",
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

  // --- GET edit user form ---
  router.get("/edit/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(404).send("Gebruiker niet gevonden");
      }

      res.render("createUser-cms", {
        user,
        editMode: true,
      });
    } catch (err) {
      console.error("Fout bij ophalen gebruiker:", err);
      res.status(500).send("Fout bij ophalen gebruiker");
    }
  });

  // --- READ all users ---
  router.get("/", async (req, res) => {
    try {
      const users = await db.collection("users").find().toArray();
      res.render("users-cms", { users });
    } catch (err) {
      console.error("Fout bij ophalen users:", err);
      res.status(500).send("Fout bij ophalen gebruikers");
    }
  });

  // --- UPDATE existing user ---
  router.post("/edit/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const { username, email, password } = req.body;

      if (!username || !email) {
        return res.status(400).send("Username en email zijn verplicht");
      }

      const updateData = { username, email };

      if (password) {
        // alleen update wachtwoord als er iets is ingevuld
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }

      await db
        .collection("users")
        .updateOne({ _id: new ObjectId(userId) }, { $set: updateData });

      res.redirect("/cms/users");
    } catch (err) {
      console.error("Fout bij updaten gebruiker:", err);
      res.status(500).send("Fout bij updaten gebruiker");
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
