import multer from "multer";
import path from "path";

// -----------------------------
// STORAGE VOOR EVENTS
// -----------------------------
const eventStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/events");
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

// -----------------------------
// STORAGE VOOR ARTISTS
// -----------------------------
const artistStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/artists");
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

// -----------------------------
// EXPORTS
// -----------------------------
export const uploadEvent = multer({ storage: eventStorage });
export const uploadArtist = multer({ storage: artistStorage });
