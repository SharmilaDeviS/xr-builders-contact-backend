# XR Builders — Contact Form Email Backend (100% Free)

This sends every contact form submission on xrbuilders.net to **both**:
- naveen.navalarch@gmail.com
- sharmila57angular@gmail.com

It uses your own Gmail account as the sender (free, no monthly limits like third-party form services), via Nodemailer + an "App Password."

---

## 1. Generate a Gmail App Password (5 minutes)

You need a Gmail account to send FROM (can be a personal @gmail.com, or contact@xrbuilders.net if that inbox is hosted on Google Workspace).

1. Go to https://myaccount.google.com/security
2. Turn on **2-Step Verification** if it isn't already on (required for App Passwords)
3. Go to https://myaccount.google.com/apppasswords
4. Create a new App Password → name it "XR Builders Website"
5. Copy the 16-character password shown (spaces don't matter)

## 2. Configure the project

1. Rename `.env.example` to `.env`
2. Fill in:
   ```
   GMAIL_USER=youraddress@gmail.com
   GMAIL_APP_PASSWORD=abcdwxyzabcdwxyz
   ```

## 3. Run locally (to test)

```bash
npm install
npm start
```

Server starts on `http://localhost:3000`. Test it with:

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","organisation":"Acme","inquiryType":"Demo Request","message":"Hello, this is a test."}'
```

Check both Gmail inboxes — the email should arrive within seconds.

## 4. Deploy for free (choose one)

**Render.com (recommended, free tier, easiest)**
1. Push this folder to a GitHub repo
2. Go to https://render.com → New → Web Service → connect the repo
3. Build command: `npm install` | Start command: `npm start`
4. Add environment variables `GMAIL_USER` and `GMAIL_APP_PASSWORD` in the Render dashboard (Environment tab)
5. Deploy — you'll get a URL like `https://xr-builders-contact.onrender.com`

**Railway.app** and **Cyclic.sh** also offer similar free tiers if you prefer alternatives.

> Free tiers on Render sleep after inactivity and take ~30s to "wake up" on the first request. That's fine for a low-traffic contact form; the visitor just sees "Sending…" a little longer on the first submission of the day.

## 5. Point the website at your deployed backend

In `index.html`, replace the EmailJS script block with the fetch-based version in
`frontend-contact-form-snippet.html` (included in this folder), and set:

```js
const BACKEND_URL = 'https://xr-builders-contact.onrender.com/api/contact';
```

## 6. Lock down CORS (recommended before going live)

In `server.js`, replace:
```js
app.use(cors());
```
with:
```js
app.use(cors({ origin: 'https://www.xrbuilders.net' }));
```
so only your own site can call the endpoint.

---

## Alternative: no backend at all (EmailJS)

The site's existing code already has EmailJS wired up. EmailJS's free tier (200 emails/month)
requires no server:

1. Sign up at https://www.emailjs.com
2. Add your Gmail as an Email Service → copy the **Service ID**
3. Create an Email Template. In the template's **"To Email"** field, put both addresses
   separated by a comma:
   ```
   naveen.navalarch@gmail.com, sharmila57angular@gmail.com
   ```
4. Copy the **Template ID** and your **Public Key** (Account → General)
5. In `index.html`, fill in:
   ```js
   const EMAILJS_PUBLIC_KEY  = 'your_public_key';
   const EMAILJS_SERVICE_ID  = 'your_service_id';
   const EMAILJS_TEMPLATE_ID = 'your_template_id';
   ```

This is faster to set up than the backend, but gives you less control (200 email/month cap,
less protection against spam bots). The Node backend above has no fixed cap beyond Gmail's own
sending limit (~500 emails/day on a free Gmail account).
