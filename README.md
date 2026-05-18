# OVA - Bharatiya Open Volunteer Association (Website Clone)

A MERN stack clone of the [OVA.ngo](https://www.ova.ngo/) website - Volunteer India | Make a Difference. This project replicates the original content, design, and functionality using MongoDB, Express, React, and Node.js.

## Features

- **Home** - Hero sections, programs, services, testimonials, stats, events preview
- **About Us** - Mission, vision, values, why choose OVA
- **Services** - Sustainability, Job Readiness, Social Services, Computer Literacy, Psychological Support
- **Events** - Fundraising events listing
- **Gallery** - Image gallery (uses original OVA images where available)
- **Our Team** - Team member profiles
- **Contact** - Contact form with backend storage
- **Join a Member** - Membership/volunteer signup
- **Donate** - Donation information, FAQs, bank details

## Tech Stack

- **Frontend**: React 18, React Router, Bootstrap 5, Axios
- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas connection string)

## Installation

1. **Clone and install dependencies:**
   ```bash
   cd ova
   npm run install-all
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your `MONGODB_URI` if needed.

3. **Run the application:**
   ```bash
   npm run dev
   ```
   This starts:
   - Backend server on http://localhost:5000
   - React dev server on http://localhost:3000

4. **Open in browser:** http://localhost:3000

## Production Build

```bash
npm run build
npm start
```

The built React app will be served from Express on the configured PORT (default 5000).

## Project Structure

```
ova/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Navbar, Footer
│   │   ├── pages/          # Home, About, Services, etc.
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                 # Express backend
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   └── index.js
├── package.json
└── README.md
```

## API Endpoints

- `POST /api/contact` - Submit contact form
- `POST /api/newsletter` - Newsletter subscription

## Images

The app uses images from the original OVA website (ova.ngo) where available. Some images may use placeholders if the original URLs are inaccessible. For full image support, you can download images from the original site and place them in `client/public/images/`.

## License

MIT - Educational/portfolio project. Original content © Bharatiya Open Volunteer Association.
