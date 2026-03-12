import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();

export default function usersRoutes(db){

router.post("/create", async (req, res) => {

try{

const { username, email, password } = req.body;

const hashedPassword = await bcrypt.hash(password, 10);

const newUser = {
username,
email,
password: hashedPassword,
createdAt: new Date()
};

await db.collection("users").insertOne(newUser);

res.redirect("/gebruikers");

}catch(err){
console.log(err);
res.status(500).send("Fout bij aanmaken gebruiker");
}

});

return router;

}