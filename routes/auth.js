import express from "express";
import bcrypt from "bcrypt";

// export functie zodat we database (db) kunnen gebruiken
export default function authRoutes(db) {
  const router = express.Router(); // nieuwe router
  const usersCollection = db.collection("users"); // users collection uit MongoDB

  // --- LOGIN pagina tonen ---
  router.get("/login", (req, res) => {
    res.render("login-cms"); // laat login pagina zien
  });

  // --- LOGIN verwerken ---
  router.post("/login", async (req, res) => {
    try {
      // haal email en wachtwoord uit form
      let { email, password } = req.body;

      // (optioneel) email netjes maken
      // email = email.trim().toLowerCase();

      //  zoek gebruiker in database
      const user = await usersCollection.findOne({ email: email });

      console.log("LOGIN EMAIL:", email);
      console.log("USER GEVONDEN:", user);

      // als gebruiker niet bestaat → error
      if (!user) {
        return res.render("login-cms", { error: "Gebruiker niet gevonden" });
      }

      //  check wachtwoord (bcrypt vergelijkt hash)
      const match = await bcrypt.compare(password, user.password);

      // als wachtwoord fout is → error
      if (!match) {
        return res.render("login-cms", { error: "Wachtwoord fout" });
      }

      //  session opslaan (user is ingelogd)
      req.session.userId = user._id;
      req.session.username = user.username;

      //  redirect naar CMS pagina
      res.redirect("/cms/events");
    } catch (err) {
      console.error(err);
      res.render("login-cms", { error: "Er is iets misgegaan" });
    }
  });

  // --- LOGOUT ---
  router.get("/logout", (req, res) => {
    // verwijder session (uitloggen)
    req.session.destroy((err) => {
      if (err) return res.send("Error bij logout");

      // terug naar login pagina
      res.redirect("/cms/");
    });
  });

  return router; // router teruggeven aan server.js
}
