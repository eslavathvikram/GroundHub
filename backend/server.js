const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ── File Upload Setup ────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only image files are allowed"), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB max

// Serve uploaded files as static
app.use("/uploads", express.static(UPLOADS_DIR));

// POST /api/upload  — accepts up to 10 images at once
app.post("/api/upload", upload.array("images", 10), (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ error: "No files uploaded" });

  const urls = req.files.map(
    (f) => `${req.protocol}://${req.get("host")}/uploads/${f.filename}`
  );
  res.json({ urls });
});
// ────────────────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || "ground_booking_super_secret_key_987654";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ground-booking";

// In-Memory Database Fallback State (if MongoDB is not available)
let useMemoryDb = false;
const memoryDb = {
  users: [],
  grounds: [
    {
      _id: "g1",
      name: "Elite Cricket Stadium",
      location: "Hyderabad, Jubilee Hills",
      price: 1200,
      description: "A premium floodlit grass stadium with standard pitch, viewing gallery, and professional training equipment.",
      imageUrl: "https://images.unsplash.com/photo-1531415080290-bc9b899d8602?q=80&w=600&auto=format&fit=crop",
      owner: "p1",
      slots: ["06:00 - 08:00", "08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"],
      createdAt: new Date()
    },
    {
      _id: "g2",
      name: "Golden Goal Soccer Turf",
      location: "Warangal, Hunter Road",
      price: 800,
      description: "Premium FIFA-approved artificial grass turf for 5-a-side and 7-a-side football matches. Open 24/7.",
      imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop",
      owner: "p1",
      slots: ["06:00 - 08:00", "08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"],
      createdAt: new Date()
    },
    {
      _id: "g3",
      name: "Smash Arena Badminton Club",
      location: "Secunderabad, Cantonment",
      price: 400,
      description: "Indoor multi-court facility featuring premium synthetic mats, top-tier lighting, and locker room access.",
      imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop",
      owner: "p2",
      slots: ["08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00"],
      createdAt: new Date()
    }
  ],
  bookings: []
};

// Seed initial memory provider user
bcrypt.hash("provider123", 10).then(hashedPassword => {
  memoryDb.users.push({
    _id: "p1",
    name: "Vikram Reddy (Provider)",
    email: "provider@example.com",
    password: hashedPassword,
    role: "provider",
    createdAt: new Date()
  });
});
bcrypt.hash("customer123", 10).then(hashedPassword => {
  memoryDb.users.push({
    _id: "c1",
    name: "Sai Kumar",
    email: "customer@example.com",
    password: hashedPassword,
    role: "customer",
    createdAt: new Date()
  });
});

// Attempt database connection
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 2500 // Quick timeout to fall back cleanly if local Mongo is not running
})
  .then(() => {
    console.log("Connected to MongoDB successfully!");
  })
  .catch(err => {
    console.log("MongoDB connection failed or not running. Falling back to IN-MEMORY Mock Database.");
    useMemoryDb = true;
  });

// Import Mongoose Models
const User = require("./models/user");
const Ground = require("./models/ground");
const Booking = require("./models/booking");

// --- JWT Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access Denied: No Token Provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Access Denied: Invalid Token" });
    }
    req.user = decoded;
    next();
  });
};

// --- Authentication APIs ---

// ── OTP System ──────────────────────────────────────────────────────────────
const otps = new Map();

// Helper to generate 6-digit numeric OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to send OTP email
const sendOtpEmail = async (email, otp, name = "User", purpose = "verification") => {
  console.log("\n" + "=".repeat(60));
  console.log(`[OTP SYSTEM - DEVELOPMENT MODE]`);
  console.log(`To: ${email}`);
  console.log(`Name: ${name}`);
  console.log(`Purpose: ${purpose.toUpperCase()}`);
  console.log(`OTP Code: ${otp}`);
  console.log("=".repeat(60) + "\n");

  // Check if SMTP is configured in environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = require("nodemailer");
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const subject = purpose === "login" 
        ? "Your OTP for GroundHub Sign In" 
        : "Verify Your GroundHub Account";

      const htmlContent = `
        <div style="font-family: 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; font-size: 2.5rem;">🏏</div>
          <h2 style="text-align: center; color: #111111; margin-top: 0; font-size: 1.6rem; font-weight: 700;">GroundHub Authentication</h2>
          <p style="color: #555555; font-size: 0.95rem; line-height: 1.6; text-align: center;">
            Hello ${name},<br>
            Use the following One-Time Password (OTP) to complete your request.
          </p>
          <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <span style="font-size: 2.2rem; font-weight: 800; letter-spacing: 6px; color: #111111; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #999999; font-size: 0.8rem; line-height: 1.5; text-align: center;">
            This OTP is valid for 5 minutes. Do not share it with anyone.<br>
            If you did not request this code, please ignore this email.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || "GroundHub"}" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        html: htmlContent,
      });
      console.log(`[OTP SYSTEM] Email sent successfully to ${email}`);
    } catch (err) {
      console.error("[OTP SYSTEM] Error sending email via SMTP:", err.message);
    }
  }
};

// Send OTP
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email, purpose, role, name } = req.body;
    if (!email || !purpose) {
      return res.status(400).json({ error: "Email and purpose are required" });
    }

    const emailKey = email.toLowerCase().trim();

    // Validations based on purpose
    if (purpose === "login") {
      if (useMemoryDb) {
        const user = memoryDb.users.find(u => u.email === emailKey);
        if (!user) {
          return res.status(404).json({ error: "No user found with this email" });
        }
        if (role && user.role !== role) {
          const expectedTab = user.role === "provider" ? "Service Provider" : "Customer";
          return res.status(403).json({ error: `This email is registered as a ${user.role}. Please switch to the "${expectedTab}" tab to sign in.` });
        }
      } else {
        const user = await User.findOne({ email: emailKey });
        if (!user) {
          return res.status(404).json({ error: "No user found with this email" });
        }
        if (role && user.role !== role) {
          const expectedTab = user.role === "provider" ? "Service Provider" : "Customer";
          return res.status(403).json({ error: `This email is registered as a ${user.role}. Please switch to the "${expectedTab}" tab to sign in.` });
        }
      }
    } else if (purpose === "register") {
      if (useMemoryDb) {
        const exists = memoryDb.users.find(u => u.email === emailKey);
        if (exists) {
          if (role && exists.role !== role) {
            return res.status(400).json({ error: `This email is already registered as a ${exists.role}. Please use a different email.` });
          }
          return res.status(400).json({ error: "User already exists with this email" });
        }
      } else {
        const exists = await User.findOne({ email: emailKey });
        if (exists) {
          if (role && exists.role !== role) {
            return res.status(400).json({ error: `This email is already registered as a ${exists.role}. Please use a different email.` });
          }
          return res.status(400).json({ error: "User already exists with this email" });
        }
      }
    } else {
      return res.status(400).json({ error: "Invalid OTP purpose" });
    }

    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000; // 5 mins

    // Store in our Map
    otps.set(emailKey, { otp, expires, purpose, role, name });

    // Send email
    const recipientName = name || (purpose === "login" ? "User" : "New User");
    await sendOtpEmail(email.trim(), otp, recipientName, purpose);

    // Return response. In development/testing, we return devOtp.
    const responseData = { message: "OTP sent successfully. Please check your email." };
    // Expose devOtp for development convenience
    if (process.env.NODE_ENV !== "production") {
      responseData.devOtp = otp;
    }

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP (Login or Complete Registration)
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp, purpose, password, name, role } = req.body;
    if (!email || !otp || !purpose) {
      return res.status(400).json({ error: "Email, OTP, and purpose are required" });
    }

    const emailKey = email.toLowerCase().trim();
    const record = otps.get(emailKey);

    if (!record) {
      return res.status(400).json({ error: "No active OTP request found for this email" });
    }

    if (Date.now() > record.expires) {
      otps.delete(emailKey);
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    if (record.purpose !== purpose) {
      return res.status(400).json({ error: "Invalid OTP request context" });
    }

    // OTP is valid! Proceed based on purpose.
    otps.delete(emailKey); // Clear OTP on success

    if (purpose === "login") {
      let loggedInUser = null;

      if (useMemoryDb) {
        loggedInUser = memoryDb.users.find(u => u.email === emailKey);
      } else {
        loggedInUser = await User.findOne({ email: emailKey });
      }

      if (!loggedInUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Enforce role separation if specified
      if (role && loggedInUser.role !== role) {
        const expectedTab = loggedInUser.role === "provider" ? "Service Provider" : "Customer";
        return res.status(403).json({ error: `This email is registered as a ${loggedInUser.role}. Please switch to the "${expectedTab}" tab to sign in.` });
      }

      const token = jwt.sign({ id: loggedInUser._id, role: loggedInUser.role }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({
        message: "Login successful via OTP",
        token,
        user: { id: loggedInUser._id, name: loggedInUser.name, email: loggedInUser.email, role: loggedInUser.role }
      });

    } else if (purpose === "register") {
      if (!password || !role || !name) {
        return res.status(400).json({ error: "Name, password, and role are required for registration verification" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      if (useMemoryDb) {
        // Double check if user registered in the meantime
        const exists = memoryDb.users.find(u => u.email === emailKey);
        if (exists) {
          return res.status(400).json({ error: "User already exists with this email" });
        }

        const newUser = {
          _id: "u_" + Date.now(),
          name,
          email: emailKey,
          password: hashedPassword,
          role,
          createdAt: new Date()
        };
        memoryDb.users.push(newUser);

        const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: "7d" });
        return res.status(201).json({
          message: "User registered successfully via OTP (In-Memory DB)",
          token,
          user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
        });
      } else {
        // Double check if user registered in the meantime
        const exists = await User.findOne({ email: emailKey });
        if (exists) {
          return res.status(400).json({ error: "User already exists with this email" });
        }

        const newUser = new User({
          name,
          email: emailKey,
          password: hashedPassword,
          role
        });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: "7d" });
        return res.status(201).json({
          message: "User registered successfully via OTP",
          token,
          user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
        });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (useMemoryDb) {
      const exists = memoryDb.users.find(u => u.email === email.toLowerCase());
      if (exists) {
        if (exists.role !== role) {
          return res.status(400).json({ error: `This email is already registered as a ${exists.role}. Please use a different email.` });
        }
        return res.status(400).json({ error: "User already exists with this email" });
      }

      const newUser = {
        _id: "u_" + Date.now(),
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        createdAt: new Date()
      };
      memoryDb.users.push(newUser);

      const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: "7d" });
      return res.status(201).json({
        message: "User registered successfully (In-Memory DB)",
        token,
        user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
      });
    } else {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) {
        if (exists.role !== role) {
          return res.status(400).json({ error: `This email is already registered as a ${exists.role}. Please use a different email.` });
        }
        return res.status(400).json({ error: "User already exists with this email" });
      }

      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role
      });
      await newUser.save();

      const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: "7d" });
      return res.status(201).json({
        message: "User registered successfully",
        token,
        user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (useMemoryDb) {
      const user = memoryDb.users.find(u => u.email === email.toLowerCase());
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Enforce role separation: provider can't login as customer and vice versa
      if (role && user.role !== role) {
        const expectedTab = user.role === "provider" ? "Service Provider" : "Customer";
        return res.status(403).json({ error: `This email is registered as a ${user.role}. Please switch to the "${expectedTab}" tab to sign in.` });
      }

      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({
        message: "Login successful (In-Memory DB)",
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } else {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Enforce role separation: provider can't login as customer and vice versa
      if (role && user.role !== role) {
        const expectedTab = user.role === "provider" ? "Service Provider" : "Customer";
        return res.status(403).json({ error: `This email is registered as a ${user.role}. Please switch to the "${expectedTab}" tab to sign in.` });
      }

      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({
        message: "Login successful",
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Profile Info
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    if (useMemoryDb) {
      const user = memoryDb.users.find(u => u._id === req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
    } else {
      const user = await User.findById(req.user.id).select("-password");
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// --- Public Stats API ---
app.get("/api/public/stats", async (req, res) => {
  try {
    let grounds = [];
    let bookings = [];

    if (useMemoryDb) {
      grounds = memoryDb.grounds;
      bookings = memoryDb.bookings;
    } else {
      grounds = await Ground.find();
      bookings = await Booking.find().populate("ground");
    }

    const activeBookings = bookings.filter(b => b.status !== "cancelled");
    const groundsCount = grounds.length;
    const bookingsCount = activeBookings.length;

    const cityStatsMap = {};

    grounds.forEach(g => {
      if (g.location) {
        const city = g.location.split(",")[0].trim();
        if (city) {
          if (!cityStatsMap[city]) {
            cityStatsMap[city] = {
              city,
              groundsCount: 0,
              bookingsCount: 0
            };
          }
          cityStatsMap[city].groundsCount += 1;
        }
      }
    });

    activeBookings.forEach(b => {
      let groundObj = b.ground;
      if (useMemoryDb && typeof groundObj === "string") {
        groundObj = grounds.find(g => g._id === b.ground);
      }
      if (groundObj && groundObj.location) {
        const city = groundObj.location.split(",")[0].trim();
        if (city) {
          if (!cityStatsMap[city]) {
            cityStatsMap[city] = {
              city,
              groundsCount: 0,
              bookingsCount: 0
            };
          }
          cityStatsMap[city].bookingsCount += 1;
        }
      }
    });

    const cityStats = Object.values(cityStatsMap);

    res.json({
      groundsCount,
      bookingsCount,
      citiesCount: cityStats.length,
      cities: cityStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Ground Management APIs ---

// GET All Grounds (For customer viewing)
app.get("/api/grounds", async (req, res) => {
  try {
    if (useMemoryDb) {
      return res.json(memoryDb.grounds);
    } else {
      const grounds = await Ground.find().populate("owner", "name email");
      return res.json(grounds);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Ground by ID
app.get("/api/grounds/:id", async (req, res) => {
  try {
    if (useMemoryDb) {
      const ground = memoryDb.grounds.find(g => g._id === req.params.id);
      if (!ground) return res.status(404).json({ error: "Ground not found" });
      return res.json(ground);
    } else {
      const ground = await Ground.findById(req.params.id).populate("owner", "name email");
      if (!ground) return res.status(404).json({ error: "Ground not found" });
      return res.json(ground);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Grounds owned by current Provider
app.get("/api/grounds/provider/list", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "provider") {
      return res.status(403).json({ error: "Unauthorized. Only service providers can manage grounds" });
    }

    if (useMemoryDb) {
      const grounds = memoryDb.grounds.filter(g => g.owner === req.user.id);
      return res.json(grounds);
    } else {
      const grounds = await Ground.find({ owner: req.user.id });
      return res.json(grounds);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const getPriceForDate = (ground, dateString) => {
  if (!dateString) return ground.price;
  try {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dateObj = new Date(dateString);
    const dayName = days[dateObj.getDay()];

    let dayPrice;
    if (ground.dayPrices && typeof ground.dayPrices.get === "function") {
      dayPrice = ground.dayPrices.get(dayName);
    } else if (ground.dayPrices) {
      dayPrice = ground.dayPrices[dayName];
    }

    if (dayPrice !== undefined && dayPrice !== null && dayPrice > 0) {
      return Number(dayPrice);
    }
  } catch (e) {
    console.error("Error parsing date for price calculation:", e);
  }
  return ground.price;
};

// Create Ground
app.post("/api/grounds", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "provider") {
      return res.status(403).json({ error: "Unauthorized. Only service providers can add grounds" });
    }

    const { name, groundType, location, price, description, imageUrl, slots, instructions, images, services, dayPrices, contactNumber, contactEmail } = req.body;
    if (!name || !location || !price) {
      return res.status(400).json({ error: "Name, location, and price are required" });
    }

    if (useMemoryDb) {
      const newGround = {
        _id: "g_" + Date.now(),
        name,
        groundType: groundType || "Other",
        location,
        price: Number(price),
        description,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=600&auto=format&fit=crop",
        instructions,
        images: images || [],
        services: services || [],
        dayPrices: dayPrices || {},
        contactNumber,
        contactEmail,
        owner: req.user.id,
        slots: slots || ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00"],
        createdAt: new Date()
      };
      memoryDb.grounds.push(newGround);
      return res.status(201).json(newGround);
    } else {
      const newGround = new Ground({
        name,
        groundType: groundType || "Other",
        location,
        price: Number(price),
        description,
        imageUrl,
        instructions,
        images,
        services,
        dayPrices,
        contactNumber,
        contactEmail,
        owner: req.user.id,
        slots
      });
      await newGround.save();
      return res.status(201).json(newGround);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Ground
app.put("/api/grounds/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "provider") {
      return res.status(403).json({ error: "Unauthorized. Only service providers can edit grounds" });
    }

    const { name, groundType, location, price, description, imageUrl, slots, instructions, images, services, dayPrices, contactNumber, contactEmail } = req.body;

    if (useMemoryDb) {
      const index = memoryDb.grounds.findIndex(g => g._id === req.params.id && g.owner === req.user.id);
      if (index === -1) {
        return res.status(404).json({ error: "Ground not found or unauthorized" });
      }

      memoryDb.grounds[index] = {
        ...memoryDb.grounds[index],
        name: name || memoryDb.grounds[index].name,
        groundType: groundType !== undefined ? groundType : memoryDb.grounds[index].groundType,
        location: location || memoryDb.grounds[index].location,
        price: price !== undefined ? Number(price) : memoryDb.grounds[index].price,
        description: description || memoryDb.grounds[index].description,
        imageUrl: imageUrl || memoryDb.grounds[index].imageUrl,
        slots: slots || memoryDb.grounds[index].slots,
        instructions: instructions !== undefined ? instructions : memoryDb.grounds[index].instructions,
        images: images || memoryDb.grounds[index].images,
        services: services || memoryDb.grounds[index].services,
        dayPrices: dayPrices || memoryDb.grounds[index].dayPrices,
        contactNumber: contactNumber !== undefined ? contactNumber : memoryDb.grounds[index].contactNumber,
        contactEmail: contactEmail !== undefined ? contactEmail : memoryDb.grounds[index].contactEmail
      };
      return res.json(memoryDb.grounds[index]);
    } else {
      const ground = await Ground.findOneAndUpdate(
        { _id: req.params.id, owner: req.user.id },
        { name, groundType, location, price, description, imageUrl, slots, instructions, images, services, dayPrices, contactNumber, contactEmail },
        { new: true }
      );
      if (!ground) return res.status(404).json({ error: "Ground not found or unauthorized" });
      return res.json(ground);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Ground
app.delete("/api/grounds/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "provider") {
      return res.status(403).json({ error: "Unauthorized. Only service providers can delete grounds" });
    }

    if (useMemoryDb) {
      const index = memoryDb.grounds.findIndex(g => g._id === req.params.id && g.owner === req.user.id);
      if (index === -1) {
        return res.status(404).json({ error: "Ground not found or unauthorized" });
      }
      memoryDb.grounds.splice(index, 1);
      // Clean up bookings for this ground
      memoryDb.bookings = memoryDb.bookings.filter(b => b.ground !== req.params.id);
      return res.json({ message: "Ground deleted successfully" });
    } else {
      const ground = await Ground.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
      if (!ground) return res.status(404).json({ error: "Ground not found or unauthorized" });
      // Delete bookings for this ground
      await Booking.deleteMany({ ground: req.params.id });
      return res.json({ message: "Ground deleted successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// --- Booking APIs ---

// Get Booked Slots for a Ground on a Specific Date
app.get("/api/bookings/booked-slots/:groundId/:date", async (req, res) => {
  try {
    const { groundId, date } = req.params;

    if (useMemoryDb) {
      const booked = memoryDb.bookings
        .filter(b => b.ground === groundId && b.date === date && b.status !== "cancelled")
        .map(b => b.slot);
      return res.json(booked);
    } else {
      const bookings = await Booking.find({ ground: groundId, date, status: { $ne: "cancelled" } });
      const bookedSlots = bookings.map(b => b.slot);
      return res.json(bookedSlots);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book a slot
app.post("/api/bookings", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ error: "Unauthorized. Only customers can make bookings" });
    }

    const { groundId, date, slot } = req.body;
    if (!groundId || !date || !slot) {
      return res.status(400).json({ error: "Ground ID, date, and slot are required" });
    }

    // Check price and details
    let groundDetails;
    if (useMemoryDb) {
      groundDetails = memoryDb.grounds.find(g => g._id === groundId);
      if (!groundDetails) return res.status(404).json({ error: "Ground not found" });

      // Check if already booked
      const isAlreadyBooked = memoryDb.bookings.some(
        b => b.ground === groundId && b.date === date && b.slot === slot && b.status !== "cancelled"
      );
      if (isAlreadyBooked) {
        return res.status(400).json({ error: "This slot is already booked for the selected date" });
      }

      const bookingPrice = getPriceForDate(groundDetails, date);

      const newBooking = {
        _id: "b_" + Date.now(),
        ground: groundId,
        customer: req.user.id,
        date,
        slot,
        price: bookingPrice,
        status: "confirmed",
        createdAt: new Date()
      };
      memoryDb.bookings.push(newBooking);

      return res.status(201).json({
        message: "Slot booked successfully (In-Memory DB)",
        booking: newBooking
      });
    } else {
      groundDetails = await Ground.findById(groundId);
      if (!groundDetails) return res.status(404).json({ error: "Ground not found" });

      // Check if already booked
      const isAlreadyBooked = await Booking.findOne({
        ground: groundId,
        date,
        slot,
        status: { $ne: "cancelled" }
      });
      if (isAlreadyBooked) {
        return res.status(400).json({ error: "This slot is already booked for the selected date" });
      }

      const bookingPrice = getPriceForDate(groundDetails, date);

      const newBooking = new Booking({
        ground: groundId,
        customer: req.user.id,
        date,
        slot,
        price: bookingPrice,
        status: "confirmed"
      });
      await newBooking.save();

      return res.status(201).json({
        message: "Slot booked successfully",
        booking: newBooking
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Bookings for logged in Customer
app.get("/api/bookings/customer", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ error: "Unauthorized. Only customers can view their bookings" });
    }

    if (useMemoryDb) {
      const bookings = memoryDb.bookings
        .filter(b => b.customer === req.user.id)
        .map(b => {
          const ground = memoryDb.grounds.find(g => g._id === b.ground) || {};
          return { ...b, ground };
        });
      // Sort bookings from newest to oldest
      bookings.sort((a, b) => b.createdAt - a.createdAt);
      return res.json(bookings);
    } else {
      const bookings = await Booking.find({ customer: req.user.id })
        .populate("ground")
        .sort({ createdAt: -1 });
      return res.json(bookings);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Bookings for grounds owned by Provider
app.get("/api/bookings/provider", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "provider") {
      return res.status(403).json({ error: "Unauthorized. Only providers can view received bookings" });
    }

    if (useMemoryDb) {
      const providerGroundIds = memoryDb.grounds
        .filter(g => g.owner === req.user.id)
        .map(g => g._id);

      const bookings = memoryDb.bookings
        .filter(b => providerGroundIds.includes(b.ground))
        .map(b => {
          const ground = memoryDb.grounds.find(g => g._id === b.ground) || {};
          const customer = memoryDb.users.find(u => u._id === b.customer) || { name: "Guest User", email: "guest@example.com" };
          return {
            ...b,
            ground,
            customer: { name: customer.name, email: customer.email }
          };
        });
      bookings.sort((a, b) => b.createdAt - a.createdAt);
      return res.json(bookings);
    } else {
      const providerGrounds = await Ground.find({ owner: req.user.id });
      const providerGroundIds = providerGrounds.map(g => g._id);

      const bookings = await Booking.find({ ground: { $in: providerGroundIds } })
        .populate("ground")
        .populate("customer", "name email")
        .sort({ createdAt: -1 });
      return res.json(bookings);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel a booking
app.put("/api/bookings/:id/cancel", authenticateToken, async (req, res) => {
  try {
    if (useMemoryDb) {
      const booking = memoryDb.bookings.find(b => b._id === req.params.id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      // Ensure user owns booking or ground owner cancels it
      let isAuthorized = booking.customer === req.user.id;
      if (!isAuthorized && req.user.role === "provider") {
        const ground = memoryDb.grounds.find(g => g._id === booking.ground);
        if (ground && ground.owner === req.user.id) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({ error: "Unauthorized to cancel this booking" });
      }

      booking.status = "cancelled";
      return res.json({ message: "Booking cancelled successfully", booking });
    } else {
      const booking = await Booking.findById(req.params.id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      let isAuthorized = booking.customer.toString() === req.user.id;
      if (!isAuthorized && req.user.role === "provider") {
        const ground = await Ground.findById(booking.ground);
        if (ground && ground.owner.toString() === req.user.id) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({ error: "Unauthorized to cancel this booking" });
      }

      booking.status = "cancelled";
      await booking.save();
      return res.json({ message: "Booking cancelled successfully", booking });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Admin Management APIs ---

// GET Stats
app.get("/api/admin/stats", async (req, res) => {
  try {
    if (useMemoryDb) {
      const totalUsers = memoryDb.users.length;
      const totalGrounds = memoryDb.grounds.length;
      const totalBookings = memoryDb.bookings.length;
      return res.json({ totalUsers, totalGrounds, totalBookings });
    } else {
      const totalUsers = await User.countDocuments();
      const totalGrounds = await Ground.countDocuments();
      const totalBookings = await Booking.countDocuments();
      return res.json({ totalUsers, totalGrounds, totalBookings });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET All Users
app.get("/api/admin/users", async (req, res) => {
  try {
    if (useMemoryDb) {
      // Exclude passwords
      const users = memoryDb.users.map(({ password, ...u }) => u);
      return res.json(users);
    } else {
      const users = await User.find().select("-password");
      return res.json(users);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE User by ID (and their grounds/bookings)
app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (useMemoryDb) {
      const index = memoryDb.users.findIndex(u => u._id === id);
      if (index === -1) {
        return res.status(404).json({ error: "User not found" });
      }
      const deletedUser = memoryDb.users.splice(index, 1)[0];
      
      // Clean up bookings and grounds owned by this user
      if (deletedUser.role === "provider") {
        const providerGroundIds = memoryDb.grounds
          .filter(g => g.owner === id)
          .map(g => g._id);
        
        // Remove grounds
        memoryDb.grounds = memoryDb.grounds.filter(g => g.owner !== id);
        // Remove bookings on these grounds
        memoryDb.bookings = memoryDb.bookings.filter(b => !providerGroundIds.includes(b.ground));
      } else {
        // Remove customer bookings
        memoryDb.bookings = memoryDb.bookings.filter(b => b.customer !== id);
      }
      return res.json({ message: "User deleted successfully" });
    } else {
      const userObj = await User.findById(id);
      if (!userObj) {
        return res.status(404).json({ error: "User not found" });
      }

      await User.findByIdAndDelete(id);

      if (userObj.role === "provider") {
        const grounds = await Ground.find({ owner: id });
        const groundIds = grounds.map(g => g._id);
        
        await Ground.deleteMany({ owner: id });
        await Booking.deleteMany({ ground: { $in: groundIds } });
      } else {
        await Booking.deleteMany({ customer: id });
      }

      return res.json({ message: "User and associated data deleted successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Ground by ID (Admin override, no owner checks)
app.delete("/api/admin/grounds/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (useMemoryDb) {
      const index = memoryDb.grounds.findIndex(g => g._id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Ground not found" });
      }
      memoryDb.grounds.splice(index, 1);
      memoryDb.bookings = memoryDb.bookings.filter(b => b.ground !== id);
      return res.json({ message: "Ground deleted successfully" });
    } else {
      const ground = await Ground.findByIdAndDelete(id);
      if (!ground) return res.status(404).json({ error: "Ground not found" });
      await Booking.deleteMany({ ground: id });
      return res.json({ message: "Ground deleted successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});