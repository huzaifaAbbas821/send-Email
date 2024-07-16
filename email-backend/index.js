require("dotenv").config();
const express = require("express");
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const UAParser = require("ua-parser-js");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Define the Token schema and model
// const tokenSchema = new mongoose.Schema({
//   email: String,
//   token: String,
//   createdAt: { type: Date, default: Date.now, expires: "10m" }, // TTL index
//   payment: { type: Boolean, default: false },
//   isUsed: { type: Number, default: 1 },
//   userAgent: String,
//   fingerprint: String,
//   ipAddress: String,
// });
const tokenSchema = new mongoose.Schema({
  email: String,
  token: String,
  createdAt: { type: Date, default: Date.now, expires: "10m" }, // TTL index
  payment: { type: Boolean, default: false },
  isUsed: { type: Number, default: 1 },
  userAgent: String,
  fingerprint: String,
  ipAddress: String,
  isActive: { type: Boolean, default: true }, // New field to manage token status
});


const Token = mongoose.model("Token", tokenSchema);

const app = express();

const secret = crypto.randomBytes(32).toString("base64");
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

app.use(bodyParser.json());

// Enable CORS for all routes
app.use(cors({
  origin: 'https://send-email-murex.vercel.app', // Replace with your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] ,
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Middleware to add CORS headers to the response
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://send-email-murex.vercel.app"); // Replace with your frontend URL
  res.header("Access-Control-Allow-Methods", "GET, POST', 'PUT', 'DELETE', 'OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

// Generate a fingerprint using UAParserJS
const generateFingerprint = (req) => {
  const parser = new UAParser();
  const uaResult = parser.setUA(req.headers["user-agent"]).getResult();
  const fingerprintData = `${uaResult.browser.name}-${uaResult.browser.version}-${uaResult.os.name}-${uaResult.os.version}-${req.headers['user-agent']}`;
  return crypto.createHash('sha256').update(fingerprintData).digest('hex');
};

// Middleware to check if the token is valid and not expired
const checkTokenStatus = async (req, res, next) => {
  const token = req.query.token;
  const clientIpAddress = req.ip;

  try {
    const tokenDoc = await Token.findOne({ token });

    if (!tokenDoc) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (tokenDoc.isUsed !== 1) {
      return res.status(400).json({ message: "Token has already been used or expired" });
    }

    const fingerprint = generateFingerprint(req);
    if (tokenDoc.fingerprint !== fingerprint) {
      return res.status(400).json({ message: 'Access restricted to the original device and browser only' });
    }

    if (tokenDoc.ipAddress !== clientIpAddress) {
      return res.status(400).json({ message: 'Access restricted to the original IP address only' });
    }

    req.tokenDoc = tokenDoc;
    next();
  } catch (error) {
    console.error("Error checking token status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Endpoint to send login email
// app.post("/login-email", async (req, res) => {
//   const { email, fingerprint } = req.body;
//   const clientIpAddress = req.ip;

//   if (!email) {
//     return res.status(400).json({ message: "Email is required" });
//   }

//   try {
//     const oldToken = await Token.findOne({ email });

//     if (oldToken) {
//       const decoded = jwt.decode(oldToken.token);
//       const currentTime = Math.floor(Date.now() / 1000);

//       if (decoded.exp > currentTime) {
//         if (oldToken.fingerprint === fingerprint) {
//           const newToken = jwt.sign({ email }, secret, { expiresIn: "4m" });
//           const loginLink = `https://send-email-murex.vercel.app/verify-token?token=${newToken}`;

//           const mailOptions = {
//             from: emailUser,
//             to: email,
//             subject: "Login Link",
//             text: `Click the link to log in: ${loginLink}`,
//             html: `<p>Click the link to log in: <a href="${loginLink}">${loginLink}</a></p>`,
//           };

//           await transporter.sendMail(mailOptions);

//           oldToken.token = newToken;
//           oldToken.isUsed = 1;
//           oldToken.createdAt = Date.now();
//           await oldToken.save();

//           return res.status(200).json({ message: "Login link sent and token updated" });
//         } else {
//           return res.status(400).json({ message: "Account on this email is still logged in on another device" });
//         }
//       }
//     }

//     const token = jwt.sign({ email }, secret, { expiresIn: "4m" });
//     const loginLink = `https://send-email-murex.vercel.app/verify-token?token=${token}`;

//     const mailOptions = {
//       from: emailUser,
//       to: email,
//       subject: "Login Link",
//       text: `Click the link to log in: ${loginLink}`,
//       html: `<p>Click the link to log in: <a href="${loginLink}">${loginLink}</a></p>`,
//     };

//     await transporter.sendMail(mailOptions);

//     const userAgent = req.headers["user-agent"];
//     const newFingerprint = generateFingerprint(req);
//     await Token.findOneAndUpdate(
//       { email },
//       { email, token, createdAt: Date.now(), isUsed: 1, userAgent, fingerprint: newFingerprint, ipAddress: clientIpAddress },
//       { upsert: true, new: true, setDefaultsOnInsert: true }
//     );

//     res.status(200).json({ message: "Login link sent and user data saved" });
//   } catch (error) {
//     console.error("Error sending email or saving token:", error);
//     res.status(500).json({ message: "Error sending email or saving token" });
//   }
// });
app.post("/login-email", async (req, res) => {
  const { email } = req.body;
  const clientIpAddress = req.ip;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Invalidate old tokens
    await Token.updateMany({ email, isActive: true }, { $set: { isActive: false } });

    const token = jwt.sign({ email }, secret, { expiresIn: "4m" });
    const loginLink = `https://send-email-murex.vercel.app/verify-token?token=${token}`;

    const mailOptions = {
      from: emailUser,
      to: email,
      subject: "Login Link",
      text: `Click the link to log in: ${loginLink}`,
      html: `<p>Click the link to log in: <a href="${loginLink}">${loginLink}</a></p>`,
    };

    await transporter.sendMail(mailOptions);

    const userAgent = req.headers["user-agent"];
    const fingerprint = generateFingerprint(req);

    await Token.findOneAndUpdate(
      { email },
      { email, token, createdAt: Date.now(), isUsed: 1, userAgent, fingerprint, ipAddress: clientIpAddress, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: "Login link sent and user data saved" });
  } catch (error) {
    console.error("Error sending email or saving token:", error);
    res.status(500).json({ message: "Error sending email or saving token" });
  }
});

// Endpoint to update payment status
app.post("/update-payment-status", async (req, res) => {
  const { token } = req.body;

  try {
    const tokenDoc = await Token.findOne({ token });
    if (!tokenDoc) {
      return res.status(404).json({ message: "Token not found" });
    }

    tokenDoc.payment = true;
    await tokenDoc.save();

    res.status(200).json({ message: "Payment status updated successfully" });
  } catch (err) {
    console.error("Error updating payment status:", err);
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
});

// Endpoint to verify token with middleware applied
app.get("/verify-token", checkTokenStatus, async (req, res) => {
  const token = req.query.token;
  const tokenDoc = req.tokenDoc;

  jwt.verify(token, secret, async (err, decoded) => {
    if (err) {
      console.error("Error verifying token:", err);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    try {
      await tokenDoc.updateOne({ $set: { isUsed: 2 } });
      res.status(200).json({ message: "Working", handle: true, Payment: tokenDoc.payment });
    } catch (updateError) {
      console.error("Error updating token status:", updateError);
      res.status(500).json({ message: "Internal server error" });
    }
  });
});

// Stripe endpoint to create payment intent
app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ message: "Amount is required" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).send({
      error: error.message,
    });
  }
});

// Catch-all route for undefined routes
app.use('/', (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
