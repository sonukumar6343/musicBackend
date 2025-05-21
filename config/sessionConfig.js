// // sessionConfig.js
// import session from 'express-session';

// const sessionMiddleware = session({
//   secret: process.env.SESSION_SECRET || 'your-session-secret',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: process.env.NODE_ENV === 'production' }
// });

// export default sessionMiddleware;


// // sessionConfig.js
// import session from 'express-session';

// const isProduction = process.env.NODE_ENV === 'production';
// console.log("isProduction",isProduction);

// const sessionMiddleware = session({
//   secret: process.env.SESSION_SECRET || 'your-session-secret',
//   resave: false,
//   saveUninitialized: false, // better security (don't create empty sessions)
//   cookie: {
//     httpOnly: true,           // Prevent JS access (recommended)
//     secure: isProduction ? true : false, // HTTPS only in production
//     sameSite: isProduction ? 'None' : 'Lax', // 'None' for cross-origin in prod, 'Lax' for localhost
//     maxAge: 3 * 24 * 60 * 60 * 1000, // Optional: 3 days session expiry
//   }
// });

// export default sessionMiddleware;



import session from 'express-session';
import MongoStore from 'connect-mongo';

const isProduction = process.env.NODE_ENV === 'production';

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URL,  // Your MongoDB connection string
    collectionName: 'sessions',
  }),
  cookie: {
    httpOnly: true,
    secure: isProduction ? true : false, // HTTPS only in production               // true if in production (HTTPS required)
    sameSite: isProduction ? 'None' : 'Lax',
    maxAge: 3 * 24 * 60 * 60 * 1000,   // 3 days
  },
});

export default sessionMiddleware;


