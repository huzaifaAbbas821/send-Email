


require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // Exit if MongoDB connection fails
  });

// Define the Token schema and model
const tokenSchema = new mongoose.Schema({
  email: String,
  userName: String,
  token: String,
  createdAt: { type: Date, default: Date.now, expires: '10m' }, // TTL index
  used: { type: Boolean, default: false },
});
const Token = mongoose.model('Token', tokenSchema);

const secret = process.env.SECRET || crypto.randomBytes(32).toString('base64');
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

app.use(bodyParser.json());
app.use(cors());

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

// Endpoint to send login email
app.post('/login-email', async (req, res) => {
  const { email, username } = req.body;
  if (!email || !username) {
    return res.status(400).json({ message: 'Email and username are required' });
  }

  const token = jwt.sign({ email, username }, secret, { expiresIn: '10m' });
  const loginLink = `https://send-email-murex.vercel.app/verify-token?token=${token}`;

  const mailOptions = {
    from: emailUser,
    to: email,
    subject: 'Login Link',
    text: `Click the link to log in: ${loginLink}`,
    html: `<p>Click the link to log in: <a href="${loginLink}">${loginLink}</a></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);

    const newToken = new Token({
      email,
      userName: username,
      token,
    });

    await newToken.save();

    res.status(200).json({ message: 'Login link sent and user data saved' });
  } catch (error) {
    console.error('Error sending email or saving token:', error);
    res.status(500).json({ message: 'Error sending email or saving token' });
  }
});

// Endpoint to verify token
app.get('/verify-token', async (req, res) => {
  const token = req.query.token;
  try {
    const tokenDoc = await Token.findOne({ token });

    if (!tokenDoc) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    if (tokenDoc.used) {
      return res.status(400).json({ message: 'Token has already been used' });
    }

    tokenDoc.used = true;
    await tokenDoc.save();

    res.status(200).json({ message: `Welcome, ${tokenDoc.userName}` });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Catch-all route for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
