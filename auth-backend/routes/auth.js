const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: '1h' 
    });
};

// ============================ Route for new user registration ============================
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, confirm_password } = req.body;

        // Check that all mandatory fields are filled in
        if (!username || !email || !password || !confirm_password) {
            return res.status(400).json({ message: 'Please enter all fields.' });
        }
        
        // Check if a user with this username already exists
        const userExistsByUsername = await User.findOne({ username });
        if (userExistsByUsername) {
            return res.status(400).json({ message: 'The username is already taken.' });
        }

        // Check if there is already a user with this email address
        const userExistsByEmail = await User.findOne({ email });
        if (userExistsByEmail) {
            return res.status(400).json({ message: 'A user with this Email already exists.' });
        }

        // Password length check
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Check if password and confirm password are same
        if (password != confirm_password) {
            return res.status(400).json({ message: 'Passwords sre not same.' });
        }

        // Create a new user.
        const newUser = await User.create({
            username,
            email,
            password
        });

        const token = generateToken(newUser._id);

        // Send a successful response to the client (status 201 - Created)
        res.status(201).json({
            message: 'User successfully registered!',
            userId: newUser._id,
            username: newUser.username,
            token
        });

    } catch (error) {
        console.error('Registration error:', error.message);
        // Handle validation errors that may occur
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        // General server error
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// ================================ User login route ================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        //=================== Server validation ===================
        // Check that the email and password are filled in
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter Email and Password.' });
        }

        // Looking for a user in the database by Email.
        const user = await User.findOne({ email }).select('+password');

        // If the user is not found
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);

        // If the passwords do not match
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = generateToken(user._id);

        // Send a successful response to the client (status 200 - OK)
        res.status(200).json({
            message: 'Entry successful!',
            userId: user._id,
            username: user.username,
            token 
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Server error on login.' });
    }
});

// ======================== Route to start Google authentication ========================
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'] 
}));

// =============================== Google callback route ===============================
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login.html?error=google_failed' }),
    // This function will be called after successful authentication through Google
    async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                return res.redirect('http://localhost:3000/login.html?error=google_user_not_found');
            }

            // Generate our own JWT for the user
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.redirect(`http://localhost:3000/index.html?token=${token}&username=${encodeURIComponent(user.username)}`);

        } catch (err) {
            console.error('Error when generating token after Google OAuth:', err);
            res.redirect('http://localhost:3000/login.html?error=google_auth_failed');
        }
    }
);

module.exports = router;