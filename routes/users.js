// importeren van benodigde modules
import express from "express";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

export default function usersRoutes(db) {
  // router aanmaken en de users collectie ophalen uit de database
  const router = express.Router();
  const usersCollection = db.collection("users");

  // deze functie checkt of de gebruiker is ingelogd, zo niet stuur hem dan door naar de loginpagina
  function checkAuth(req, res, next) {
    if (!req.session.userId) {
      return res.redirect("/cms/login");
    }
    next();
  }

  // gebruiker aanmaken, pakt de gegevens uit het formulier
  router.post("/create", checkAuth, async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // controleren of alle velden zijn ingevuld
      if (!username || !email || !password) {
        return res.status(400).send("Alle velden zijn verplicht");
      }

      // wachtwoord hashen zodat het veilig opgeslagen wordt
      const hashedPassword = await bcrypt.hash(password, 10);

      // nieuw gebruiker object aanmaken met de gegevens uit het formulier en het gehashte wachtwoord
      const newUser = {
        username,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: "admin",
        createdAt: new Date(),
      };

      // gebruiker opslaan in de database
      await usersCollection.insertOne(newUser);

      // na het aanmaken van de gebruiker, terug naar de users pagina
      res.redirect("/cms/users");
    } catch (err) {
      console.error("Fout bij aanmaken gebruiker:", err);
      res.status(500).send("Fout bij aanmaken gebruiker");
    }
  });

  // alle gebruikers ophalen en weergeven
  router.get("/", checkAuth, async (req, res) => {
    try {
      const users = await usersCollection.find().toArray();
      res.render("users-cms", {
        users,
        search: "", // lege string meegeven zodat de zoekbalk geen error geeft
      });
    } catch (err) {
      console.error("Fout bij ophalen users:", err);
      res.status(500).send("Fout bij ophalen gebruikers");
    }
  });

  // ajax route voor de zoekfunctie, geeft resultaten terug als json
  router.get("/search/ajax", async (req, res) => {
    try {
      const search = req.query.search || "";

      // als er niks ingevuld is, alle gebruikers teruggeven
      let query = {};

      // zoeken in username, email en role tegelijk
      if (search) {
        query = {
          $or: [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { role: { $regex: search, $options: "i" } },
          ],
        };
      }

      const users = await db.collection("users").find(query).toArray();
      res.json(users);
    } catch (err) {
      console.error("Fout bij AJAX zoeken users:", err);
      res.status(500).json({ error: "Fout bij zoeken" });
    }
  });

  // edit formulier ophalen voor de gekozen gebruiker
  router.get("/edit/:id", checkAuth, async (req, res) => {
    try {
      const userId = req.params.id;

      // gebruiker zoeken op id
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

      // check om te zien of de gebruiker bestaat, zo niet stuurt hij je een 404 error
      if (!user) {
        return res.status(404).send("Gebruiker niet gevonden");
      }

      // formulier invullen met de bestaande gegevens van de gebruiker, zodat je deze kan aanpassen
      res.render("createUser-cms", {
        user,
        editMode: true,
      });
    } catch (err) {
      console.error("Fout bij ophalen gebruiker:", err);
      res.status(500).send("Fout bij ophalen gebruiker");
    }
  });

  // gebruiker updaten, pakt de nieuwe gegevens uit het formulier
  router.post("/edit/:id", checkAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const { username, email, password } = req.body;

      // username en email zijn verplicht
      if (!username || !email) {
        return res.status(400).send("Username en email zijn verplicht");
      }

      const updateData = { username, email: email.trim().toLowerCase() };

      // wachtwoord alleen updaten als er een nieuw wachtwoord is ingevuld
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // gebruiker updaten in de database
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData },
      );

      // na het updaten van de gebruiker, terug naar de users pagina
      res.redirect("/cms/users");
    } catch (err) {
      console.error("Fout bij updaten gebruiker:", err);
      res.status(500).send("Fout bij updaten gebruiker");
    }
  });

  // gebruiker verwijderen op basis van id
  router.post("/delete/:id", checkAuth, async (req, res) => {
    try {
      // het id uit de url halen
      const userId = req.params.id;

      // verwijder de gebruiker uit de database
      await usersCollection.deleteOne({ _id: new ObjectId(userId) });

      // na het verwijderen terug naar de gebruikerslijst sturen
      res.redirect("/cms/users");
    } catch (err) {
      console.error("Fout bij verwijderen gebruiker:", err);
      res.status(500).send("Fout bij verwijderen gebruiker");
    }
  });

  return router;
}
