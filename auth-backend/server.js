const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const path = require('path'); 
require('./config/passport-setup'); 

// Loading environment variables
dotenv.config({ path: path.join(__dirname, '../.env') }); 

// Importing authentication routes
const authRoutes = require('./routes/auth'); 

const app = express();

// ===================================== Middleware =====================================

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', `http://localhost:${process.env.PORT || 5000}`],
    credentials: true 
}));

app.use(express.json());

// Setting up a session for Passport
app.use(session({
    secret: process.env.JWT_SECRET, 
    resave: false, 
    saveUninitialized: true, 
    cookie: { maxAge: 24 * 60 * 60 * 1000 } 
}));

// Initializing the Passport
app.use(passport.initialize());
app.use(passport.session()); 

// MongoDB port and URI configuration
const PORT = process.env.PORT || 5000; 
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB successfully connected!'))
    .catch(err => console.error('MongoDB connection error:', err.message));

app.use(express.static(path.join(__dirname, '..'))); 

// Connecting API Routes
app.use('/api/auth', authRoutes);

// A simple GET request to verify that the server is running
app.get('/api-status', (req, res) => { 
    res.send('API works!');
});

// ============================ Handler 404 ============================
app.use((req, res, next) => {
    res.status(404);

    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, '../404.html')); 
        return;
    }
    if (req.accepts('json')) {
        res.json({ error: 'Not Found', message: `The requested URL ${req.originalUrl} was not found.` });
        return;
    }
    res.type('txt').send('Not Found');
});


// Server startup
app.listen(PORT, () => {
    console.log(`The server is running on port ${PORT}`);
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
});