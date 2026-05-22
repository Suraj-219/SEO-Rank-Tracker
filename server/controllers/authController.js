import User from "../models/User.model.js"
// Register user
export const register = async(req, res) => {
    try {
        const {name, email, password} = req.body;

        if(!name, !email, !password) return res.status(400).json({
            success: false, message: "All fields are required"
        });

        // Check if user exists
        const existingUser = await User.findOne({email})
        if(existingUser) return res.status(400).json({
            success: false, message: "User already exists"
        });

    } catch (error) {

    }
}