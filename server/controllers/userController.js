import { request } from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js"; 

//signup  a new user

export const signup = async (req,res) => {
    const { fullname, email,password, bio} = req.body;
    try {
        if(!fullname || !email || !password || !bio){
            return res.status(400).json({ success: false, message: "Missing Details" })
        }
        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.json({success: false, message: "Account already exists" }) 
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = await User.create({
            fullname,
            email,
            password: hashedPassword,
            bio
        });
        const token = generateToken(newUser._id);

        res.json({
            success: true,
            userData: newUser, 
            token, 
            message: "Account created successfully!" })
         
    } catch (error) {
        console.log("Signup error: ",error.message);
        res.json({success: false,message: error.message })
    }
}


// Controller to login a user

export const login = async (req,res) => {
    try {
        const { email,password } = req.body;
        const userData = await User.findOne({email})

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);

        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        if(!isPasswordCorrect){
            return res.json({success: false, message: "Invalid credentials"});
        }
        
        const token = generateToken(userData._id)
        res.json({success:true, userData,token, message: "Login successful"});
    } catch (error) {
        console.log("Login error: ",error.message);
        res.json({success: false,message: error.message })
    }
}


// Controller to check if user is authenticated
export const checkAuth = (req,res)=>{
    res.json({success: true, user: req.user}); 
}

// Controller to update user profile details

export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullname} = req.body;

        const userId = req.user._id;
        let updateUser;

        if (!profilePic) {
            await User.findByIdAndUpdate(userId,{bio, fullname}, {new: true})
        }
        else{
            const upload = await cloudinary.uploader.upload(profilePic);

            updateUser = await User.findByIdAndUpdate(userId, {profilePic: upload.secure_url, bio, fullname}, {new:true});
        }

        res.json({success: true, user: updateUser})
    } catch (error) {
        console.log("Profile Update failed ", error.message);
        res.json({success: false, message: error.message})
    }
}
