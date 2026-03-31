// importeren van benodigde modules
import express from "express";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

export default function usersRoutes(db) {
  // aanmaken van de router en de users collectie
  const router = express.Router();
  const usersCollection = db.collection("users");

  // check om te kijken of de gebruiker is ingelogd, zo niet wordt hij doorgestuurd naar de login pagina
  function checkAuth(req, res, next) {
    if (!req.session.userId) {
      return res.redirect("/cms/login"); 
    }
    next();
  }

  // --- GET create user form ---
  router.post("/create", checkAuth, async (req, res) => {
    
    try {
      const { username, email, password } = req.body;

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

      await usersCollection.insertOne(newUser);

      res.redirect("/cms/users");
    } catch (err) {
      console.error("Fout bij aanmaken gebruiker:", err);
      res.status(500).send("Fout bij aanmaken gebruiker");
    }
  });

  // --- GET edit user form ---
  router.get("/edit/:id", checkAuth, async (req, res) => {
    // ✅ checkAuth toegevoegd
    try {
      const userId = req.params.id;
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

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
  router.get("/", checkAuth, async (req, res) => {
    try {
      const users = await usersCollection.find().toArray();
      res.render("users-cms", {
        users,
        search: ""   // <— DIT IS WAT JE MIST
      });
    } catch (err) {
      console.error("Fout bij ophalen users:", err);
      res.status(500).send("Fout bij ophalen gebruikers");
    }
  });

  // ajax route

  router.get("/search/ajax", async (req, res) => {
  try {
    const search = req.query.search || "";

    let query = {};

    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { role: { $regex: search, $options: "i" } }
        ]
      };
    }

    const users = await db.collection("users").find(query).toArray();
    res.json(users);
  } catch (err) {
    console.error("Fout bij AJAX zoeken users:", err);
    res.status(500).json({ error: "Fout bij zoeken" });
  }
});

  // --- UPDATE existing user ---
  router.post("/edit/:id", checkAuth, async (req, res) => {
    // ✅ checkAuth toegevoegd
    try {
      const userId = req.params.id;
      const { username, email, password } = req.body;

      if (!username || !email) {
        return res.status(400).send("Username en email zijn verplicht");
      }

      const updateData = { username, email: email.trim().toLowerCase() };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData },
      );

      res.redirect("/cms/users");
    } catch (err) {
      console.error("Fout bij updaten gebruiker:", err);
      res.status(500).send("Fout bij updaten gebruiker");
    }
  });

  // --- DELETE user ---
  router.post("/delete/:id", checkAuth, async (req, res) => {
    // ✅ checkAuth toegevoegd
    try {
      const userId = req.params.id;
      await usersCollection.deleteOne({ _id: new ObjectId(userId) });
      res.redirect("/cms/users");
    } catch (err) {
      console.error("Fout bij verwijderen gebruiker:", err);
      res.status(500).send("Fout bij verwijderen gebruiker");
    }
  });

  return router;
}
