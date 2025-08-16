import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { storage } from './storage';
import { User } from '@shared/schema';
import jwt from 'jsonwebtoken';
import { sendOTPVerificationEmail } from './services/gmail';
import { z } from 'zod';

// OTP storage - In production, use a proper database
const otpStore: { [email: string]: { otp: string; expires: Date } } = {};

// JWT settings
const JWT_SECRET = process.env.JWT_SECRET || 'blinkeach-jwt-secret-key';
const JWT_EXPIRES_IN = '7d';

declare global {
  namespace Express {
    interface User extends Omit<User, 'password'> {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOTP(email: string, otp: string) {
  // OTP expires in 10 minutes
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 10);
  otpStore[email] = { otp, expires };
}

function verifyOTP(email: string, otp: string) {
  const storedOTP = otpStore[email];
  if (!storedOTP) return false;
  if (new Date() > storedOTP.expires) {
    delete otpStore[email];
    return false;
  }
  return storedOTP.otp === otp;
}

function cleanupExpiredOTPs() {
  const now = new Date();
  Object.keys(otpStore).forEach((email) => {
    if (now > otpStore[email].expires) {
      delete otpStore[email];
    }
  });
}

// Run cleanup every 15 minutes
setInterval(cleanupExpiredOTPs, 15 * 60 * 1000);

function generateToken(user: Express.User) {
  return jwt.sign(
    { id: user.id, email: user.email, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function sanitizeUser(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'blinkeach-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      sameSite: 'lax'
    },
    store: storage.sessionStore,
  };

  app.set('trust proxy', 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          return done(null, sanitizeUser(user));
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Google Strategy (if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are provided)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/api/auth/google/callback',
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('Email not provided from Google'));
            }
            
            let user = await storage.getUserByEmail(email);

            if (!user) {
              // Create new user with Google info
              // Google has already verified the email, so we mark it as verified
              user = await storage.createUser({
                username: profile.displayName || `user_${profile.id}`,
                email: email,
                password: await hashPassword(randomBytes(16).toString('hex')),
                fullName: profile.displayName || '',
                profilePicture: profile.photos?.[0]?.value || null,
                isGoogleUser: true,
                emailVerified: true,
              });
            } else {
              // If user exists but was not a Google user before, update their status
              if (!user.isGoogleUser) {
                user = await storage.updateUser(user.id, {
                  isGoogleUser: true,
                }) || user;
              }
              
              // Update profile picture if available from Google
              if (profile.photos?.[0]?.value && (!user.profilePicture || user.profilePicture !== profile.photos[0].value)) {
                user = await storage.updateUser(user.id, {
                  profilePicture: profile.photos[0].value,
                }) || user;
              }
            }

            return done(null, sanitizeUser(user));
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // Facebook Strategy (if FACEBOOK_APP_ID and FACEBOOK_APP_SECRET are provided)
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: '/api/auth/facebook/callback',
          profileFields: ['id', 'displayName', 'email', 'photos'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('Email not provided from Facebook'));
            }
            
            let user = await storage.getUserByEmail(email);

            if (!user) {
              // Create new user with Facebook info
              // Facebook has already verified the email
              user = await storage.createUser({
                username: profile.displayName || `user_${profile.id}`,
                email: email,
                password: await hashPassword(randomBytes(16).toString('hex')),
                fullName: profile.displayName || '',
                profilePicture: profile.photos?.[0]?.value || null,
                isFacebookUser: true,
                emailVerified: true,
              });
            } else {
              // If user exists but was not a Facebook user before, update their status
              if (!user.isFacebookUser) {
                user = await storage.updateUser(user.id, {
                  isFacebookUser: true,
                }) || user;
              }
              
              // Update profile picture if available from Facebook
              if (profile.photos?.[0]?.value && (!user.profilePicture || user.profilePicture !== profile.photos[0].value)) {
                user = await storage.updateUser(user.id, {
                  profilePicture: profile.photos[0].value,
                }) || user;
              }
            }

            return done(null, sanitizeUser(user));
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user ? sanitizeUser(user) : null);
    } catch (err) {
      done(err);
    }
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    // First check if user is authenticated via session
    if (req.isAuthenticated()) {
      return next();
    }
    
    // If not authenticated via session, check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Verify and decode the token
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number, email: string, isAdmin: boolean };
        
        // Get user from database
        const user = await storage.getUser(decoded.id);
        if (!user) {
          return res.status(401).json({ error: 'Unauthorized - Invalid user' });
        }
        
        // Set user in request
        req.user = sanitizeUser(user);
        return next();
      } catch (error) {
        console.error('JWT verification error:', error);
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
      }
    }
    
    // If no valid authentication, return unauthorized
    res.status(401).json({ error: 'Unauthorized' });
  };

  // Middleware to check if user is admin
  const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    // First check if authenticated
    if (!req.isAuthenticated()) {
      // Check JWT token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          // Verify and decode the token
          const decoded = jwt.verify(token, JWT_SECRET) as { id: number, email: string, isAdmin: boolean };
          
          // Get user from database
          const user = await storage.getUser(decoded.id);
          if (!user) {
            return res.status(401).json({ error: 'Unauthorized - Invalid user' });
          }
          
          // Set user in request
          req.user = sanitizeUser(user);
        } catch (error) {
          console.error('JWT verification error:', error);
          return res.status(401).json({ error: 'Unauthorized - Invalid token' });
        }
      } else {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }
    
    // Now check if the authenticated user is an admin
    if (req.user && req.user.isAdmin) {
      return next();
    }
    
    res.status(403).json({ error: 'Forbidden - Admin access required' });
  };

  // Local auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, username, password, fullName } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(password),
        fullName,
        emailVerified: false, // User needs to verify email separately
      });

      // Auto login after registration
      req.login(sanitizeUser(user), (err) => {
        if (err) {
          return res.status(500).json({ error: 'Login failed after registration' });
        }
        
        const token = generateToken(req.user!);
        res.status(201).json({
          user: req.user,
          token,
        });
      });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return res.status(500).json({ error: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || 'Invalid credentials' });
      }
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Login failed' });
        }
        
        const token = generateToken(user);
        res.json({
          user,
          token,
        });
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Google auth routes
  app.get('/api/auth/google', passport.authenticate('google'));
  
  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      const token = generateToken(req.user!);
      // Redirect to frontend with token
      res.redirect(`/auth/success?token=${token}`);
    }
  );

  // Facebook auth routes
  app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
  
  app.get(
    '/api/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    (req, res) => {
      const token = generateToken(req.user!);
      // Redirect to frontend with token
      res.redirect(`/auth/success?token=${token}`);
    }
  );

  // OTP routes for Gmail verification
  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Generate OTP
      const otp = generateOTP();
      storeOTP(email, otp);

      // Send OTP via Gmail
      await sendOTPVerificationEmail(email, otp);

      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
      }

      // Verify OTP
      const isValid = verifyOTP(email, otp);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      // Clean up the OTP after successful verification
      delete otpStore[email];

      // Check if this email is already associated with an account
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        // If user exists and is not verified, mark as verified
        if (!existingUser.emailVerified) {
          await storage.updateUser(existingUser.id, { emailVerified: true });
        }
        
        // Return flag indicating user exists
        return res.json({ 
          message: 'OTP verified successfully',
          userExists: true,
          email
        });
      }

      res.json({ 
        message: 'OTP verified successfully',
        userExists: false,
        email
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  });
  
  // Endpoint to mark existing user's email as verified
  app.post('/api/auth/verify-email', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Mark user's email as verified
      const updatedUser = await storage.updateUser(userId, { emailVerified: true });
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        message: 'Email verified successfully',
        user: sanitizeUser(updatedUser)
      });
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(500).json({ error: 'Failed to verify email' });
    }
  });
  
  // Forgot password endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !z.string().email().safeParse(email).success) {
        return res.status(400).json({ error: 'Valid email is required' });
      }
      
      // Check if user exists with this email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // For security reasons, still return a success message
        // but include a flag that can be used by the frontend
        return res.status(200).json({ success: false, message: 'If this email is registered, a verification code has been sent.' });
      }
      
      // Generate OTP
      const otp = generateOTP();
      
      // Store OTP
      storeOTP(email, otp);
      
      // Send OTP via Gmail
      await sendOTPVerificationEmail(email, otp, 'Password Reset');
      
      // Return success response
      res.status(200).json({ success: true, message: 'Reset code sent successfully' });
    } catch (error) {
      console.error('Error in forgot password flow:', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  });
  
  // Reset password endpoint
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update user's password
      const updatedUser = await storage.updateUser(user.id, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(500).json({ error: 'Failed to update password' });
      }
      
      res.status(200).json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // User routes
  app.get('/api/auth/user', isAuthenticated, (req, res) => {
    res.json(req.user);
  });

  // Admin route for dashboard
  app.get('/api/admin/dashboard', isAdmin, (req, res) => {
    res.json({ message: 'Admin dashboard access granted' });
  });

  // Initialize admin user if it doesn't exist
  initializeAdminUser();

  return { isAuthenticated, isAdmin };
}

async function initializeAdminUser() {
  try {
    // Check if admin user already exists
    const adminUser = await storage.getUserByEmail('admin@blinkeach.com');
    
    if (!adminUser) {
      // Create admin user
      await storage.createUser({
        username: 'admin',
        email: 'admin@blinkeach.com',
        password: await hashPassword('admin123'), // Default password, should be changed immediately
        fullName: 'Administrator',
        isAdmin: true,
      });
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
}