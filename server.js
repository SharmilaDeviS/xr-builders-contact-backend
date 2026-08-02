// XR Builders — Contact Form Backend
// Sends every submission to BOTH naveen.navalarch@gmail.com and sharmila57angular@gmail.com
// Uses your existing free Gmail account via an "App Password" (no paid service needed).

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow requests with no origin (like file://)
    const allowedOrigins = [
      'https://xrbuilders.net',
      'https://www.xrbuilders.net',
      'http://localhost:3000',
      'https://xr-builders-contact-backend.onrender.com/api/contact'
    ];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  }
}));
           // In production, restrict this to your domain (see README)
app.use(express.json());

// Basic abuse protection: max 5 submissions per IP every 15 minutes
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many submissions. Please try again later.' },
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,          // e.g. contact@xrbuilders.net (must be a Gmail / Google Workspace address)
    pass: process.env.GMAIL_APP_PASSWORD,  // 16-character App Password, NOT your normal Gmail password
  },
});

const RECIPIENTS = 'naveen.navalarch@gmail.com, sharmila57angular@gmail.com';

app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, organisation, inquiryType, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  const mailOptions = {
    from: `"XR Builders Website" <${process.env.GMAIL_USER}>`,
    to: RECIPIENTS,
    replyTo: email,
    subject: `XR Builders Inquiry: ${inquiryType || 'General Inquiry'}`,
    text:
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Organisation: ${organisation || 'Not provided'}\n` +
      `Inquiry Type: ${inquiryType || 'General Inquiry'}\n\n` +
      `Message:\n${message}`,
    html: `
      <h2 style="font-family:sans-serif;color:#0a1628;">New Contact Form Submission — XR Builders</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;"><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;"><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;"><strong>Organisation</strong></td><td>${escapeHtml(organisation || 'Not provided')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;"><strong>Inquiry Type</strong></td><td>${escapeHtml(inquiryType || 'General Inquiry')}</td></tr>
      </table>
      <p style="font-family:sans-serif;font-size:14px;"><strong>Message:</strong></p>
      <p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;">${escapeHtml(message)}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email sent successfully.' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
});

// Simple health check — useful when deploying to Render/Railway to confirm it's alive
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`XR Builders contact backend running on port ${PORT}`));
