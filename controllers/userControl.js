const patientModel = require("../models/userModel.js");
const sendEmail = require("../middleware/email.js");
const generateDynamicEmail = require("../verify.js");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const multer = require("multer")
const cloudinary = require("../middleware/cloudinary")


const {
    validatorUser,
    validatorUser2
} = require("../middleware/validator")

const signUp = async (req, res) => {
    try {
        const { error } = validatorUser(req.body);
        if (error) {
            res.status(500).json({
                message: error.details[0].message
            })
            return;
        } else {
            //Get the required field from the request object body

            const firstName = req.body.trim();
            const lastName = req.body.trim();
            const email = req.body.trim();
            const password = req.body.trim();
            const phoneNumber = req.body.trim();
            const gender = req.body.trim();
            const confirmPassword = req.body.trim();

            const checkUser = await patientModel.findOne({ email: email.toLowerCase() })
            if (checkUser) {
                return res.status(200).json({
                    message: "Account already exists"
                })
            }

            //Encrypt the user's password

            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);

            if (password !== confirmPassword) {
                return res.status(400).json({
                    message: "Password must match"
                })
            }

            //Create a user
            const user = new patientModel({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                phoneNumber,
                gender,

            }
            )
            const token = jwt.sign({ userId: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email }, process.env.jwtSecret, { expiresIn: "300s" })


            sendEmail({

                email: user.email,
                subject: 'KINDLY VERIFY YOUR ACCOUNT',
                html: generateDynamicEmail(`${req.protocol}://${req.get("host")}/verify/${user.id}`, user.firstName, user.lastName)


            })


            await user.save();

            return res.status(201).json({
                message: "Account successfully created",
                data: user
            })


        }
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })

    }
}



//Function to verify a new user with a link
const verify = async (req, res) => {
    try {
        const id = req.params.id;
        //   const token = req.params.token;
        const user = await patientModel.findById(id);

        // Verify the token
        jwt.verify(user.token, process.env.jwtSecret);


        // Update the user if verification is successful
        const updatedUser = await patientModel.findByIdAndUpdate(id, { isVerified: true }, { new: true });
        console.log(updatedUser)
        if (updatedUser.isVerified === true) {
            return res.status(200).send("<h1>You have been successfully verified. Kindly visit the login page.</h1>");
        }

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            // Handle token expiration
            const id = req.params.id;
            const updatedUser = await patientModel.findById(id);
            //const { firstName, lastName, email } = updatedUser;
            const newtoken = jwt.sign({ email: updatedUser.email, firstName: updatedUser.firstName, lastName: updatedUser.lastName }, process.env.jwtSecret, { expiresIn: "300s" });
            updatedUser.token = newtoken;
            updatedUser.save();

            const link = `${req.protocol}://${req.get('host')}/verify/${id}`;
            sendEmail({
                email: updatedUser.email,
                html: generateDynamicEmail(link, updatedUser.firstName, updatedUser.lastName),
                subject: "RE-VERIFY YOUR ACCOUNT"
            });
            return res.status(401).send("<h1>This link is expired. Kindly check your email for another email to verify.</h1>");
        } else {
            return res.status(500).json({
                message: "Internal server error: " + error.message,
            });

        };
    }
}


const login = async (req, res) => {
    try {
        //Get the data from the request body
        const { email, password } = req.body;
        //check if the user info provided exists in the database
        const userExists = await patientModel.findOne({
            $or: [{ email: email }, { firstName: email }]
        });

        if (!userExists) {
            return res.status(404).json({
                message: "Invalid first name or email"
            })
            return;
        }
        const checkPassword = bcrypt.compareSync(password, userExists.password);
        if (!checkPassword) {
            return res.status(404).json({
                message: "Password is incorrect"
            })
            return;
        }

        const token = jwt.sign({
            userId: userExists._id,
            email: userExists.email,
        }, process.env.jwtSecret, { expiresIn: "1day" });

        const user = {
            firstName: userExists.firstName,
            lastName: userExists.lastName,
            email: userExists.email,
            isVerified: userExists.isVerified,
        };
        userExists.token = token;
        await userExists.save();
        if (userExists.isVerified === true) {
            return res.status(200).json({
                message: "Welcome " + userExists.firstName,
                data: user,
                token: token
            })
        }
        else {
            return res.status(400).json({
                message: "Sorry, your account is not verified yet. Please check your mail "
            })
        }
    }
    catch (err) {
        return res.status(500).json({
            message: "Internal server error " + err.message,
        })
    }
}

const forgotpassWord = async (req, res) => {
    const resetFunc = require("../forget.js")
    try {
        const checkUser = await patientModel.findOne({ email: req.body.email })
        if (!checkUser) {
            res.status(404).json("Email doesn't exist")
        } else {
            const subject = " Kindly reset your password"
            const link = `${req.protocol}://${req.get("host")}/reset/${checkUser.id}`
            const html = resetFunc(link, checkUser.firstName, checkUser.lastName)
            sendEmail({
                email: checkUser.email,
                subject: subject,
                html: html
            })


            res.status(200).json("kindly check your email for a link to reset your password")

        }
    } catch (error) {
        res.status(500).json(error.message)
    }

}


const resetpassword = async (req, res) => {
    try {
        const password = req.body.password

        const id = req.params.id

        const salt = bcrypt.genSaltSync(10);

        const hashedPassword = bcrypt.hashSync(password, salt);

        const data = { password: hashedPassword }

        const reset = await patientModel.findByIdAndUpdate(id, data, { new: true })


        res.status(200).json(`your password has been succesfully changed`)

    } catch (error) {
        res.status(500).json(error.message)
    }
}

const uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.user.userId
        const user = await patientModel.findById(userId)
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']; // Add more MIME types if needed

        // Check if the uploaded file's MIME type is allowed
        if (!allowedMimeTypes.includes(req.files.profilePicture.mimetype)) {
            return res.status(400).json({ Error: 'Only image files are allowed' });
        }
        const profilePicture = req.files.profilePicture.tempFilePath
        const fileUploader = await cloudinary.uploader.upload(profilePicture, { folder: "DocMate-Media" }, (err, profilePicture) => {
            try {

                // Delete the temporary file
                fs.unlinkSync(req.files.profilePicture.tempFilePath);

                return profilePicture
            } catch (err) {
                return err
            }
        })

        const data = {
            url: fileUploader.url,
            public_id: fileUploader.public_id
        }
        await patientModel.findByIdAndUpdate(userId, { profilePicture: data }, { new: true })
        res.status(200).json({
            message: "Profile picture updated successfully"
        });

    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while uploading the profile picture.' + error.message });
    }
};

const deleteProfilePicture = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await patientModel.findById(userId);
        if (!user) {
            res.status(404).json({
                message: 'Image does not exist'
            })
            return;
        }
        //const deletePic = user.profilePicture
        // // const index = user.profilePicture.indexOf(deletePic)
        const deleteImg = { $unset: { profilePicture: 1 } }
        await patientModel.findByIdAndUpdate(userId, deleteImg, { new: true })

        return res.status(200).json({
            message: `Profile picture deleted successfully`
        })

    } catch (err) {
        return res.status(500).json({
            message: "Internal server  error: " + err.message,
        })
    }
}
const logOut = async (req, res) => {
    try {
        //Get the user's Id from the request user payload
        const { userId } = req.user
        //
        const hasAuthorization = req.headers.authorization;
        //check if it is empty
        if (!hasAuthorization) {
            return res.status(401).json({ message: "Authorization token not found" })
        }
        //Split the token from the bearer
        const token = hasAuthorization.split(" ")[1];

        const user = await patientModel.findById(userId);

        //check if the user does not exist
        if (!user) {
            return res.status(404).json({ message: "Account not found" })
        }

        //Blacklist the token
        user.blacklist.push(token);

        await user.save();

        //Return a response

        return res.status(200).json({ message: "You have logged out successfully" })

    } catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
}





module.exports = {
    signUp, verify, login, forgotpassWord, resetpassword, uploadProfilePicture, deleteProfilePicture, logOut,
}
