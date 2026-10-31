// XR Builders — Contact Form Backend (Render free plan compatible)
// Sends mail through Brevo's HTTPS API, because Render's free plan blocks SMTP ports (25/465/587).

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();

// Render runs behind a proxy: needed so rate-limiting sees each visitor's real IP
app.set('trust proxy', 1);

// Allow production domains + localhost (any port, e.g. Angular on :4200)
const allowedOrigins = [
  'https://xrbuilders.net',
  'https://www.xrbuilders.net',
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json({ limit: '50kb' }));

// Max 5 submissions per IP every 15 minutes
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many submissions. Please try again later.' },
});

const RECIPIENTS = [
  'naveen.navalarch@gmail.com',
  'sharmila57angular@gmail.com',
  'naveen120197@gmail.com'
];

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Contact form endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, organisation, countryCode = '+', mobileNumber = '', inquiryType, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (typeof countryCode !== 'string' || countryCode.length > 4) {
    return res.status(400).json({ error: 'Country code must be a string no longer than 4 characters.' });
  }
  if (typeof mobileNumber !== 'string' || mobileNumber.length > 15) {
    return res.status(400).json({ error: 'Mobile number must be no longer than 15 digits.' });
  }

  const trimmedCountryCode = countryCode.trim() || '+';
  const trimmedMobileNumber = mobileNumber.trim();
  if (trimmedCountryCode !== '+' && !/^\+?\d{1,3}$/.test(trimmedCountryCode)) {
    return res.status(400).json({ error: 'Country code must contain 1 to 3 digits and an optional leading +.' });
  }
  if (trimmedMobileNumber && !/^\d{6,15}$/.test(trimmedMobileNumber)) {
    return res.status(400).json({ error: 'Mobile number must contain 6 to 15 digits only.' });
  }

  const subject = `XR Builders Inquiry: ${String(inquiryType || 'General Inquiry').replace(/[\r\n]+/g, ' ')}`;

  const text =
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    `Organisation: ${organisation || 'Not provided'}\n` +
    `Country Code: ${trimmedCountryCode}\n` +
    `Mobile Number: ${trimmedMobileNumber || 'Not provided'}\n` +
    `Inquiry Type: ${inquiryType || 'General Inquiry'}\n\n` +
    `Message:\n${message}`;

  const html = `
    <h2 style="font-family:sans-serif;color:#0a1628;">New Contact Form Submission — XR Builders</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
      <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
      <tr><td><strong>Organisation</strong></td><td>${escapeHtml(organisation || 'Not provided')}</td></tr>
      <tr><td><strong>Country Code</strong></td><td>${escapeHtml(trimmedCountryCode)}</td></tr>
      <tr><td><strong>Mobile Number</strong></td><td>${escapeHtml(trimmedMobileNumber || 'Not provided')}</td></tr>
      <tr><td><strong>Inquiry Type</strong></td><td>${escapeHtml(inquiryType || 'General Inquiry')}</td></tr>
    </table>
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
  `;

  try {
    await transporter.sendMail({
  from: `"XR Builders Website" <${process.env.GMAIL_USER}>`,
  to: RECIPIENTS.join(','),
  replyTo: email,
  subject,
  text,
  html
});
    res.status(200).json({ success: true, message: 'Email sent successfully.' });
  } catch (err) {
    console.error('Email send error:', err.message);
    res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
});

// Root + health check (so opening the URL in a browser shows something)
app.get('/', (req, res) => res.send('XR Builders contact API is running.'));
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