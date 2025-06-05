const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

// ======================= Storing the user ID =======================
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// ========== Get the user from the ID stored in the session ==========
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback'
    },
    // This function will be called after successful Google authentication
    async (accessToken, refreshToken, profile, done) => {

        try {
            // Search for a user by googleId
            let currentUser = await User.findOne({ googleId: profile.id });

            if (currentUser) {
                // If the user already exists, return it
                console.log('The user is already registered through Google:', currentUser.username);
                // If it doesn't have the username we want to output, we can update it
                if (!currentUser.username && profile.displayName) {
                    currentUser.username = profile.displayName;
                    await currentUser.save();
                }
                done(null, currentUser); // Save currentUser.id in the session
            } else {
                // If there is no user, create a new one
                console.log('Create a new user via Google.');
                // Check if there is already a user with this email address
                let userByEmail = await User.findOne({ email: profile.emails[0].value });
                if (userByEmail) {
                    userByEmail.googleId = profile.id;
                    await userByEmail.save();
                    console.log('An existing user is associated with Google:', userByEmail.username);
                    done(null, userByEmail);
                } else {
                    // Create a new user
                    const newUser = await User.create({
                        googleId: profile.id,
                        username: profile.displayName || profile.emails[0].value.split('@')[0],
                        email: profile.emails[0].value,
                        password: 'google-auth-user-no-password'
                    });
                    console.log('A new Google user has been created:', newUser.username);
                    done(null, newUser);
                }
            }
        } catch (err) {
            console.error('Error when processing Google profile:', err);
            done(err, null);
        }
    })
);