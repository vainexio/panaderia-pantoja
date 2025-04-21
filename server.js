const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const json2xls = require('json2xls');
const XLSX = require('xlsx');
const bcrypt = require('bcrypt');
const fs = require('fs');
const cors = require('cors');
const fetch = require('node-fetch');

const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
//
const method = require('./data/functions.js')
const settings = require('./data/settings.js')
const app = express();
app.use(cors());

// Connect to MongoDB
if (process.env.MONGOOSE) mongoose.connect(process.env.MONGOOSE);

const accountsSchema = new mongoose.Schema({
  id: Number,
  username: String,
  password: String,
});
const loginSessionSchema = new mongoose.Schema({
  session_id: String,
  ip_address: String,
  target_id: String,
  device_id: String,
});
const productsSchema = new mongoose.Schema({
  name: String,
  category: String,
  min: Number,
  max: Number,
  expiration: String,
});
const stockRecordsSchema = new mongoose.Schema({
  productName: String,
  amount: Number,
  remaining: Number,
  date: String,
});
let accounts = mongoose.model('Accounts', accountsSchema);
let products = mongoose.model('Products', productsSchema);
let stockRecords = mongoose.model('Stock Records', stockRecordsSchema);
let loginSession = mongoose.model('LoginSession', loginSessionSchema);
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'text/javascript');
    }
  }
}));
app.use((req, res, next) => {
  req.clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  next();
});
app.set('trust proxy', true);
app.use(cookieParser());
//

app.get('/admin-dashboard', async (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

/* Global Backend */
app.get('/currentAccount', async (req, res) => {
  // Device id
  let deviceId = req.cookies.deviceId;
  if (!deviceId) {
    deviceId = uuidv4();
    res.cookie('deviceId', deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }
  
  let currentSession = await fetch("https://panaderiapantoja.glitch.me/session", { headers: { cookie: req.headers.cookie || "" } });
  
  if (currentSession.ok) {
    currentSession = await currentSession.json();
    let sessionData = currentSession.session;
    
    let account = await accounts.findOne({ id: Number(sessionData.target_id) });
    if (account) return res.status(200).json(account);
    
  } else {
    console.log(currentSession);
    return res.status(404).json({ message: "No login session was found.", redirect: "/" });
  }
});
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Device id
  let deviceId = req.cookies.deviceId;
  if (!deviceId) {
    deviceId = uuidv4();
    res.cookie('deviceId', deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }
  let ip = req.ip;
  console.log(req.clientIp)
  if (ip.startsWith("::ffff:")) ip = ip.substring(7);
  const existingSession = await loginSession.findOne({ device_id: deviceId});
  // Manage login
  const admin = await accounts.findOne({ username });
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
      
      let key = method.generateSecurityKey()
      settings.allowedKeys.push(key)
      
      if (!existingSession) {
        const session = new loginSession({
          session_id: method.generateSecurityKey(),
          ip_address: ip,
          target_id: admin.id,
          device_id: deviceId,
        });
        console.log('new session')
        await session.save();
      } else if (existingSession) {
        existingSession.target_id = admin.id
        existingSession.ip_address = ip
        existingSession.device_id = deviceId
        existingSession.session_id = method.generateSecurityKey()
        console.log('old session')
        await existingSession.save();
      }
      return res.json({ redirect: '/admin-dashboard', message: 'Login successful', key });
    }
  
  return res.status(401).json({ message: 'Invalid email or password' });
});
app.get('/session', async (req, res) => {
  let deviceId = req.cookies.deviceId;
  if (!deviceId) {
    return res.status(401).json({ message: 'No device identifier found. Please log in.' });
  }
  
  try {
    const session = await loginSession.findOne({ device_id: deviceId });
    if (!session) return res.status(401).json({ message: 'Session not found. Please log in again.' });
    
    res.json({ message: 'Session valid', session });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/test', async (req, res) => {
  let doc = new accounts(accountsSchema)
  doc.id = 1;
  doc.username = "admin"
  doc.password = await bcrypt.hash("adminpass", 10)
  await doc.save();
  return doc
});
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
});