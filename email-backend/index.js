require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

// Define the Token schema and model
const tokenSchema = new mongoose.Schema({
  email: String,
  token: String,
  createdAt: { type: Date, default: Date.now, expires: '10m' }, // TTL index
  isUsed: { type: Number, default: 1 }
});
const Token = mongoose.model('Token', tokenSchema);

const app = express();

const secret = crypto.randomBytes(32).toString('base64');
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

// Middleware to check if the token is valid and not expired
const checkTokenStatus = async (req, res, next) => {
  const token = req.query.token;

  try {
    const tokenDoc = await Token.findOne({ token });

    if (!tokenDoc) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    if (tokenDoc.isUsed !== 1) {
      return res.status(400).json({ message: 'Token has already been used or expired' });
    }

    req.tokenDoc = tokenDoc; // Save tokenDoc to request object for later use
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Error checking token status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Endpoint to send login email
app.post('/login-email', async (req, res) => {
  const { email} = req.body;
  if (!email ) {
    return res.status(400).json({ message: 'Email and username are required' });
  }

  try {
    const token = jwt.sign({ email }, secret, { expiresIn: '4m' });
    const loginLink = `https://send-email-murex.vercel.app/verify-token?token=${token}`;

    const mailOptions = {
      from: emailUser,
      to: email,
      subject: 'Login Link',
      text: `Click the link to log in: ${loginLink}`,
      html: `<p>Click the link to log in: <a href="${loginLink}">${loginLink}</a></p>`,
    };

    await transporter.sendMail(mailOptions);

    await Token.findOneAndUpdate(
      { email},
      { email, token, createdAt: Date.now(), isUsed: 1 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: 'Login link sent and user data saved' });
  } catch (error) {
    console.error('Error sending email or saving token:', error);
    res.status(500).json({ message: 'Error sending email or saving token' });
  }
});

// Endpoint to verify token with middleware applied
app.get('/verify-token', checkTokenStatus, async (req, res) => {
  const token = req.query.token;
  const tokenDoc = req.tokenDoc;

  jwt.verify(token, secret, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Update token usage status
    await tokenDoc.updateOne({ $set: { isUsed: 2 } });

    res.status(200).json({ message: `Working`, handle: true });
  });
});


// stripe
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  if (amount) {
    console.log(amount);
  } else {
    console.log('Amount is missing');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card'],
    });

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({
      error: error.message,
    });
  }
});


// Catch-all route for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
