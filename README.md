# WordWise

A word puzzle game inspired by Wordle, built with React and Supabase. Includes user authentication, gameplay preferences, and a global leaderboard.

**Live site:** [wordwise-orpin.vercel.app](https://wordwise-orpin.vercel.app/)

## Features

- Wordle-style word guessing gameplay
- User authentication (sign up, log in, manage account)
- Gameplay preferences saved per user
- Global leaderboard tracking player performance
- Automated testing and deployment via GitHub Actions

## Tech Stack

- **Frontend:** React, JavaScript, CSS
- **Backend / Database:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Deployment:** Vercel, with CI/CD via GitHub Actions

## Note on live demo

This project runs on Supabase's free tier, which pauses the backend after a period of inactivity. If you're visiting the live site and authentication or the leaderboard isn't responding, the database may be paused and waking up, this can take a few seconds on the first request after inactivity.

## Getting Started

1. Clone the repo
```bash
   git clone https://github.com/Aliyan008/wordwise.git
   cd wordwise
```

2. Install dependencies
```bash
   npm install
```

3. Set up environment variables

   Create a `.env` file in the root directory with:

4. Run the development server
```bash
   npm run dev
```

## License

This project is for portfolio and demonstration purposes.
