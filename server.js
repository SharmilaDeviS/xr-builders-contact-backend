// XR Builders — Contact Form Backend
// Sends every submission to BOTH naveen.navalarch@gmail.com and sharmila57angular@gmail.com
// Uses your existing free Gmail account via an "App Password" (no paid service needed).

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();

// Allow production domains + localhost (any port)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow file://
    if (origin.startsWith('http://localhost')) return callback(null, true);
    const allowedOrigins = [
      'https://xrbuilders.net',
      'https://www.xrbuilders.net',
      'http://localhost:60496'
    ];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json());

// Basic abuse protection: max 5 submissions per IP every 15 minutes
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many submissions. Please try again later.' },
});

// ✅ Global transporter (created once)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,          // must be Gmail / Workspace address
    pass: process.env.GMAIL_APP_PASSWORD,  // 16-character App Password
  },
});

const RECIPIENTS = 'naveen.navalarch@gmail.com, sharmila57angular@gmail.com';

// Contact form endpoint
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
        <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
        <tr><td><strong>Organisation</strong></td><td>${escapeHtml(organisation || 'Not provided')}</td></tr>
        <tr><td><strong>Inquiry Type</strong></td><td>${escapeHtml(inquiryType || 'General Inquiry')}</td></tr>
      </table>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
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

// ✅ Debug route to test email sending directly
app.get('/api/test-email', async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"XR Builders Website" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // send to yourself
      subject: 'Test Email',
      text: 'This is a test email from XR Builders backend.'
    });
    res.json({ success: true, message: 'Test email sent.' });
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
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
