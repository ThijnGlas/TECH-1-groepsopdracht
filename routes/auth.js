import express from "express";
import bcrypt from "bcrypt";

export default function authRoutes(db) {
  const router = express.Router();
  const usersCollection = db.collection("users");

  // --- LOGIN pagina renderen ---
  router.get("/login", (req, res) => {
    res.render("login-cms");
  });

  // --- LOGIN POST ---
  router.post("/login", async (req, res) => {
    try {
      let { email, password } = req.body;

      // 1 Zoek gebruiker
      const user = await usersCollection.findOne({ email: email });

      console.log("LOGIN EMAIL:", email);
      console.log("USER GEVONDEN:", user);

      if (!user) {
        return res.render("login-cms", { error: "Gebruiker niet gevonden" });
      }

      // 2 Wachtwoord check
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.render("login-cms", { error: "Wachtwoord fout" });
      }

      //  Session
      req.session.userId = user._id;
      req.session.username = user.username;

      //  Redirect
      res.redirect("/cms/events");
    } catch (err) {
      console.error(err);
      res.render("login-cms", { error: "Er is iets misgegaan" });
    }
  });

  // --- LOGOUT route ---
  router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.send("Error bij logout");
      res.redirect("/cms/");
    });
  });

  return router;
}
