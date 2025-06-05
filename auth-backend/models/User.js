const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ======================= Define the data schema (structure) for the user =======================
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please enter your user name'], 
        unique: true, 
        trim: true, 
        minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
        type: String,
        required: [true, 'Please enter Email'],
        unique: true, 
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please enter a valid Email'
        ] // Checking Email format with regular expression
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false 
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    createdAt: {
        type: Date,
        default: Date.now 
    }
});


UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10); 

    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ================================= Method for comparing passwords =================================
UserSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);