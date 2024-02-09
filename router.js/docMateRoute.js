const express = require('express');

const {signUp,verify, login,forgotpassWord,resetpassword, logOut, uploadProfilePicture, deleteProfilePicture, }= require ("../controllers/userControl");


    const authenticate = require ("../middleware/authentication");


const router = express.Router();
router.post("/register", signUp);

router.put("/uploadimage", authenticate, uploadProfilePicture);
router.delete("/deleteimage", authenticate, deleteProfilePicture);

router.get("/verify/:id",verify);
router.post("/login", login);
router.post("/forgot", authenticate, forgotpassWord);
router.put("/reset/:id", authenticate, resetpassword);
router.put('/logout', authenticate, logOut);


module.exports = router

