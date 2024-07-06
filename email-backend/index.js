// index.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();

const secret = process.env.SECRET || crypto.randomBytes(32).toString('base64');
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

app.use(bodyParser.json());
app.use(cors());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPassword
  }
});

app.post('/login-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const token = jwt.sign({ email }, secret, { expiresIn: '10m' });
  const loginLink = `https://send-email-murex.vercel.app/verify-token?token=${token}`;

  const mailOptions = {
    from: emailUser,
    to: email,
    subject: 'Login Link',
    text: `Click the link to log in: ${loginLink}`,
    html: `<p>Click the link to log in: <a href="${loginLink}">${loginLink}</a></p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
      return res.status(500).json({ message: 'Error sending email' });
    }
    res.status(200).json({ message: 'Login link sent' });
  });
});

app.get('/verify-token', (req, res) => {
  const token = req.query.token;

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    res.status(200).json({ message: `Welcome, ${decoded.email}` });
  });
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
