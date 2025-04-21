const express = require('express');
const jwt = require('jsonwebtoken');
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
const JWT_SECRET = process.env.JWT_SECRET;
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
  expiry: Number,
  expiry_unit: String,
});
const categorySchema = new mongoose.Schema({
  name: String,
});
const stockRecordsSchema = new mongoose.Schema({
  productName: String,
  amount: Number,
  remaining: Number,
  date: String,
});
let categories = mongoose.model('Categories', categorySchema);
let accounts = mongoose.model('Accounts', accountsSchema);
let products = mongoose.model('Products', productsSchema);
let stockRecords = mongoose.model('Stock Records', stockRecordsSchema);
let loginSession = mongoose.model('LoginSession', loginSessionSchema);
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = await accounts.findOne({ id: payload.userId});
    const existingSession = await loginSession.findOne({ device_id: token});
    if (!existingSession) {
      res.clearCookie('token');
    } else {
      req.session = existingSession
    }
  } catch (err) {
    res.clearCookie('token');
  }
  next();
});

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
  if (!req.user) return res.status(401).send({ message: 'Not logged in', redirect: "/" });
  let user = req.user
  try {
    const account = await accounts.findOne({ id: user.id });
    if (!account) return res.status(404).json({ message: 'Account not found', redirect: "/" });
    
    const ok = user.password == account.password
    if (!ok) return res.status(401).send({ message: 'Invalid credentials', redirect: "/"});
    
    res.status(200).json(account);

  } catch (err) {
    return res.status(404).json({ message: 'Invalid or expired token', redirect: "/" });
  }

});
app.post('/login2', async (req, res) => {
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
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const remember = true
  const ip = req.ip;
  const user = await accounts.findOne({ username });
  if (!user) return res.status(401).send({ message: 'Invalid credentials'});

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).send({ message: 'Invalid credentials'});

  const expiresIn = remember
    ? 30 * 24 * 60 * 60
    : 60 * 60;

  const token = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn }
  );
  
  const existingSession = await loginSession.findOne({ device_id: token});
  if (!existingSession) {
    const session = new loginSession({
      session_id: method.generateSecurityKey(),
      ip_address: ip,
      target_id: user.id,
      device_id: token,
    });
    console.log('new session')
    await session.save();
  } else if (existingSession) {
    existingSession.target_id = user.id
    existingSession.ip_address = ip
    existingSession.device_id = token
    existingSession.session_id = method.generateSecurityKey()
    console.log('old session')
    await existingSession.save();
  }
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: expiresIn * 1000,
    sameSite: 'strict', 
  });
  return res.json({ redirect: '/admin-dashboard', message: 'Login successful' });
  //res.send({ success: true });
});

app.post('/getAllSessions', async (req, res) => {
  try {
    let deviceId = req.session.device_id;
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    const sessions = await loginSession.find({ target_id: accountId });

    const sessionsWithLocation = await Promise.all(
      sessions.map(async (session) => {
        try {
          const ipResponse = await fetch(`http://ip-api.com/json/${session.ip_address}`);
          const ipData = await ipResponse.json();
          return {
            currentSession: deviceId == session.device_id,
            session_id: session.session_id,
            ip_address: session.ip_address,
            location: `${ipData.city || 'N/A'}, ${ipData.country || 'N/A'}`,
            device_id: session.device_id,
          };
        } catch (err) {
          console.error(`Error fetching location for IP ${session.ip_address}:`, err);
          return {
            currentSession: deviceId == session.device_id,
            session_id: session.session_id,
            ip_address: session.ip_address,
            location: 'Unknown',
            device_id: session.device_id,
          };
        }
      })
    );

    sessionsWithLocation.sort((a, b) => b.currentSession - a.currentSession);

    res.json({ loginSessions: sessionsWithLocation });
  } catch (error) {
    console.error('Error in /getAllSessions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
app.delete('/removeSession', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }
    const result = await loginSession.deleteOne({ session_id: sessionId });
    if (result.deletedCount > 0) {
      return res.json({ message: "Session removed" });
    } else {
      return res.status(404).json({ error: "Session not found" });
    }
  } catch (error) {
    console.error("Error in /removeSession:", error);
    res.status(500).json({ error: "Server error" });
  }
});
app.delete('/removeOtherSessions', async (req, res) => {
  try {
    let deviceId = req.cookies.deviceId;
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({ error: "accountId is required" });
    }
    const result = await loginSession.deleteMany({ 
      target_id: accountId,
      device_id: { $ne: deviceId } 
    });
    return res.json({ message: `${result.deletedCount} session(s) removed` });
  } catch (error) {
    console.error("Error in /removeOtherSessions:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* Admin Backend */
app.post('/registerProduct', async (req, res) => {
  try {
    const { product_name, product_min, product_max, product_category, product_expiry, product_expiry_unit } = req.body;
    if (!product_name || !product_min || !product_max || !product_category || !product_expiry || !product_expiry_unit) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingProduct = await products.findOne({
      $or: [ { product_name } ]
    });

    if (existingProduct) {
      return res.status(400).json({ message: "A Product with same name already exists!" });
    }

    // Create new patient
    const newProduct = new products(productsSchema);
    newProduct.name = product_name
    newProduct.category = product_category
    newProduct.min = product_min
    newProduct.max = product_max
    newProduct.expiry = product_expiry
    newProduct.expiry_unit = product_expiry_unit
    
    // Save to database
    await newProduct.save();

    res.status(201).json({ message: "Product registered successfully!" });
  } catch (error) {
    console.error("Error registering product:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});
app.get('/getProducts', async (req, res) => {
  try {
    const foundProducts = await products.find();
    res.json(foundProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/createCategory', async (req, res) => {
  try {
    const { ctg_name } = req.body;
    
    const existingCategory = await categories.findOne({ name: ctg_name.toLowerCase()});

    if (existingCategory) {
      return res.status(400).json({ message: "This category already exists!" });
    }
    
    let newCat = new categories(categorySchema)
    newCat.name = ctg_name.toLowerCase()
    
    await newCat.save();
    res.status(201).json({ message: "Category created successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})
app.delete('/deleteCategory', async (req, res) => {
  try {
    const { catName } = req.body;
    if (!catName) {
      return res.status(400).json({ error: "Category name is required" });
    }
    const result = await categories.deleteOne({ name: catName });
    console.log(result,catName)
    if (result.deletedCount > 0) {
      return res.json({ message: "Category removed" });
    } else {
      return res.status(404).json({ error: "Category not found" });
    }
  } catch (error) {
    console.error("Error in /deleteCategory:", error);
    res.status(500).json({ error: "Server error" });
  }
})
app.get('/getCategories', async (req, res) => {
  try {
    const foundCtg = await categories.find();
    res.json(foundCtg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Update a product
app.post('/updateProduct', async (req, res) => {
  const { id, name, category, min, max, expiry, expiry_unit } = req.body;
  try {
    const updated = await products.findByIdAndUpdate(
      id,
      { name, category, min, max, expiry, expiry_unit },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Delete a product
app.delete('/deleteProduct/:id', async (req, res) => {
  try {
    await products.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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