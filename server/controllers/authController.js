import User from "../models/User.model.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Generate JWT token
const generateToken = (id)=> {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "30d"})
}

// Register user
// export const register = async(req, res) => {
//     try {
//         const {name, email, password} = req.body;

//         if(!name || !email || !password) return res.status(400).json({
//             success: false, message: "All fields are required"
//         });

//         // Check if user exists
//         const existingUser = await User.findOne({email})
//         if(existingUser) return res.status(400).json({
//             success: false, message: "User already exists"
//         });

//         // Hash Password
//         const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10))

//         // Create User
//         const user = await User.create({name, email, password:hashedPassword})

//         const token = generateToken(user._id);

//         res.status(201).json({success: true, token, user})

//     } 
//     // catch (error) {
//     //     console.error("Register error:", error.message)
//     //     res.status(500).json({success: false, message: "Server error"})
//     // }
//     catch(error){
//         console.error("Register error:", error);

//         res.status(500).json({
//             success: false,
//             message: error.message || "Server error"
//         });
//     }
// }

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        const token = generateToken(user._id);

        const safeUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            plan: user.plan,
            analysisCount: user.analysisCount
        };

        res.status(201).json({
            success: true,
            token,
            user: safeUser
        });

    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Server error"
        });
    }
};

// Login user
export const login = async(req, res) => {
    try {
        const {email, password} = req.body;

        if(!email || !password) return res.status(400).json({
            success: false, message: "All fields are required"
        });

        // Find user
        const user = await User.findOne({email})
        if(!user) return res.status(400).json({
            success: false, message: "Invalid credentials"
        });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(400).json({ success: false, message: "Invalid credentials"})
        }

        const token = generateToken(user._id);

        res.status(201).json({success: true, token, user})

    } catch (error) {
        console.error("Login error:", error.message)
        res.status(500).json({success: false, message: "Server error"})
    }
}

// Get current user
export const getUser = async(req, res) => {
    try {
        
        const user = await User.findById(req.userId).select("-password");
        if(!user){
            return res.status(400).json({success: false, message: "User not found"})
        }

        res.json({success: true, user})

    } catch (error) {
        console.error("Get user error:", error.message)
        res.status(500).json({success: false, message: "Server error"})
    }
}