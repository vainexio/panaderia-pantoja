const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const json2xls = require("json2xls");
const XLSX = require("xlsx");
const bcrypt = require("bcrypt");
const fs = require("fs");
const cors = require("cors");
const fetch = require("node-fetch");
const moment = require("moment");
const path = require("path");
const http = require("http");
const ExcelJS = require('exceljs');
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const { Server } = require("socket.io");
const { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType } = require("docx");
var pidusage = require('pidusage')

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
//
const method = require("./data/functions.js");
const settings = require("./data/settings.js");
const JWT_SECRET = process.env.JWT_SECRET;
// Connect to MongoDB
if (process.env.MONGOOSE) mongoose.connect(process.env.MONGOOSE);

const accountsSchema = new mongoose.Schema({
  id: Number,
  username: String,
  password: String,
  userLevel: Number,
});
const loginSessionSchema = new mongoose.Schema({
  session_id: String,
  ip_address: String,
  target_id: String,
  device_id: String,
});
const categorySchema = new mongoose.Schema({
  category_id: String,
  name: String,
});
const productsSchema = new mongoose.Schema({
  product_id: String,
  name: String,
  category_id: String,
  quantity: Number,
  min: Number,
  max: Number,
  expiry: Number,
  expiry_unit: String,
});
const stockRecordsSchema = new mongoose.Schema({
  product_id: String,
  type: String,
  amount: Number,
  remarks: {
    type: String,
    default: null,
  },
  date: { type: Date, default: Date.now },
  author_id: Number,
});
let categories = mongoose.model("Categories", categorySchema);
let accounts = mongoose.model("Accounts", accountsSchema);
let products = mongoose.model("Products", productsSchema);
let stockRecords = mongoose.model("Stock Records", stockRecordsSchema);
let loginSession = mongoose.model("LoginSession", loginSessionSchema);
// Middleware
app.set("trust proxy", true);
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static("public", {
    setHeaders: (res, path) => {
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "text/javascript");
      }
    },
  }));
app.use(async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = await accounts.findOne({ id: payload.userId });
    const existingSession = await loginSession.findOne({ device_id: token });
    if (!existingSession) {
      res.clearCookie("token");
    } else {
      req.session = existingSession;
    }
  } catch (err) {
    res.clearCookie("token");
  }
  next();
});
app.use(async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // "Bearer <token>"

  if (token === process.env.BYPASS_TOKEN) {
    req.user = await accounts.findOne({ id: 2 });
  }

  const publicPaths = ["/login","/admin-dashboard"];
  if (!req.user && !publicPaths.some(path => req.path.startsWith(path))) {
    return res.status(401).send({ message: "Not logged in", error: "Not logged in", redirect: "/" });
  }

  next();
});
app.use((req, res, next) => {
  req.clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/memory", async (req, res) => {
  try {
    const mem  = method.getContainerMemory();
    const cpu  = method.getContainerCpuPercent();
    const disk = method.getDiskUsage();

    // JSON response
    res.json({
      cpu: {
        percent: cpu
      },
      memory: {
        usageBytes: mem.usageBytes,
        limitBytes: mem.limitBytes,
        usagePercent: mem.usagePercent
      },
      disk: {
        usedBytes: disk.usedBytes,
        totalBytes: disk.totalBytes,
        usagePercent: disk.usagePercent
      }
    });
  } catch (err) {
    console.error("Error reading metrics:", err);
    res.status(500).send("Cannot read metrics");
  }
});
// Public
app.get("/ping", (req, res) => {
  return res.json({ pong: true, ts: Date.now() });
});
app.get("/testing", async (req, res) => {
  res.sendFile(__dirname + "/public/memory.html");
});
app.get("/admin-dashboard", async (req, res) => {
  res.sendFile(__dirname + "/public/admin.html");
});
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const remember = true;
  const ip = req.ip;
  const user = await accounts.findOne({ username: username.toLowerCase() });
  if (!user) return res.status(401).send({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).send({ message: "Invalid credentials" });

  const expiresIn = remember ? 30 * 24 * 60 * 60 : 60 * 60;

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn });

  const existingSession = await loginSession.findOne({ device_id: token });
  if (!existingSession) {
    const session = new loginSession({
      session_id: method.genId(),
      ip_address: ip,
      target_id: user.id,
      device_id: token,
    });
    console.log("new session");
    await session.save();
  } else if (existingSession) {
    existingSession.target_id = user.id;
    existingSession.ip_address = ip;
    existingSession.device_id = token;
    existingSession.session_id = method.genId();
    console.log("old session");
    await existingSession.save();
  }
  res.cookie("token", token, {
    httpOnly: true,
    maxAge: expiresIn * 1000,
    sameSite: "strict",
  });
  return res.json({
    redirect: "/admin-dashboard",
    message: "Login successful",
  });
});

// Collections/Fetch
app.get('/downloadInventory', async (req, res) => {
  try {
    const filter = req.query.filter?.toLowerCase() || 'last 7 days';
    const now = new Date();
    let since;
    switch (filter) {
      case 'today': since = new Date(now.setHours(0,0,0,0)); break;
      case 'last 7 days': since = new Date(Date.now() - 7*24*60*60*1000); break;
      case 'last 30 days': since = new Date(Date.now() - 30*24*60*60*1000); break;
      case 'this year': since = new Date(now.getFullYear(),0,1); break;
      case 'last year': since = new Date(now.getFullYear()-1,0,1); break;
      case 'all': since = null; break;
      default: since = new Date(Date.now() - 7*24*60*60*1000);
    }
    const dateQuery = since ? { date: { $gte: since } } : {};

    const [allCats, allProds, allRecs] = await Promise.all([
      categories.find().lean(),
      products.find().lean(),
      stockRecords.find(dateQuery).lean(),
    ]);

    const prodsByCat = allCats.reduce((acc, c) => {
      acc[c.category_id] = allProds.filter(p => p.category_id === c.category_id);
      return acc;
    }, {});

    const recsByProd = allRecs.reduce((acc, r) => {
      acc[r.product_id] = acc[r.product_id] || [];
      acc[r.product_id].push(r);
      return acc;
    }, {});

    const wb = new ExcelJS.Workbook();
    wb.creator = 'YourApp';
    wb.created = new Date();

    allCats.forEach(cat => {
      const sheet = wb.addWorksheet(cat.name.toUpperCase() || cat.category_id);
      const prods = prodsByCat[cat.category_id] || [];

      if (prods.length === 0) {
        sheet.getCell(1,1).value = 'No products in this category';
        sheet.getCell(1,1).font = { italic: true, color: { argb: 'FF888888' } };
        return;
      }

      let startCol = 1;
      const gap = 2;

      prods.forEach(p => {
        const ins = (recsByProd[p.product_id]||[]).filter(r => r.type === 'IN');
        const outs = (recsByProd[p.product_id]||[]).filter(r => r.type === 'OUT');

        // build FIFO queue for expiry status
        let queue = ins.map(r => ({ date: new Date(r.date).toISOString().slice(0,10), amount: r.amount }));
        outs.forEach(o => {
          let amt = o.amount;
          while (amt > 0 && queue.length) {
            if (queue[0].amount > amt) { queue[0].amount -= amt; amt = 0; }
            else { amt -= queue[0].amount; queue.shift(); }
          }
        });

        // Product title header (no fill/color)
        sheet.mergeCells(1, startCol, 1, startCol + 5);
        const title = sheet.getCell(1, startCol);
        title.value = p.name;
        title.font = { bold: true, size: 14 };

        // Product details labels & values
        const details = [ ['Quantity', p.quantity], ['Min', p.min], ['Max', p.max], ['Expiry', `${p.expiry} ${p.expiry_unit.replace('s','(s)')}`] ];
        details.forEach(([lbl, val], i) => {
          const cellLabel = sheet.getCell(2 + i, startCol);
          const cellVal   = sheet.getCell(2 + i, startCol + 1);
          cellLabel.value = lbl;
          cellVal.value   = val;
          [cellLabel, cellVal].forEach(c => {
            c.font = { color: { argb: 'FF000000' } };
            c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          });
        });

        const recHeaderRow = 2 + details.length + 1;
        // IN header
        sheet.mergeCells(recHeaderRow, startCol, recHeaderRow, startCol + 2);
        const inHdr = sheet.getCell(recHeaderRow, startCol);
        inHdr.value = 'IN';
        inHdr.font = { bold: true };
        inHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };

        // OUT header
        sheet.mergeCells(recHeaderRow, startCol + 4, recHeaderRow, startCol + 6);
        const outHdr = sheet.getCell(recHeaderRow, startCol + 4);
        outHdr.value = 'OUT';
        outHdr.font = { bold: true };
        outHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2DCDB' } };

        // Subheaders IN
        const subRow = recHeaderRow + 1;
        ['Date','Amount','Expiry'].forEach((h, i) => {
          const cell = sheet.getCell(subRow, startCol + i);
          cell.value = h;
          cell.font = { bold: true };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
        // Subheaders OUT including Remarks
        ['Date','Amount','Remarks'].forEach((h, i) => {
          const cell = sheet.getCell(subRow, startCol + 4 + i);
          cell.value = h;
          cell.font = { bold: true };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Fill IN rows
        ins.forEach((r, i) => {
          const rowIdx = subRow + 1 + i;
          const cDate = sheet.getCell(rowIdx, startCol);
          const cAmt  = sheet.getCell(rowIdx, startCol + 1);
          const cExp  = sheet.getCell(rowIdx, startCol + 2);
          const day   = new Date(r.date).toISOString().slice(0,10);
          cDate.value = day;
          cAmt.value  = r.amount;

          const expDate = new Date(r.date);
          if (p.expiry_unit==='months') expDate.setMonth(expDate.getMonth()+p.expiry);
          else if (p.expiry_unit==='years') expDate.setFullYear(expDate.getFullYear()+p.expiry);
          else expDate.setDate(expDate.getDate()+p.expiry);
          const expDay = expDate.toISOString().slice(0,10);

          // if this batch still in queue, show expiry, else if 'all' filter show 'No longer on stock'
          const inQueue = queue.some(q=>q.date===day);
          if (inQueue) {
            cExp.value = expDay;
          } else if (filter==='all') {
            cExp.value = 'No longer on stock';
            cDate.font = cAmt.font = cExp.font = { color: { argb: 'FFFF0000' } };
          } else {
            cExp.value = expDay;
          }

          [cDate, cAmt, cExp].forEach(c=>c.border={ top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'} });
        });

        // Fill OUT rows
        outs.forEach((r, i) => {
          const rowIdx = subRow + 1 + i;
          const oDate    = sheet.getCell(rowIdx, startCol + 4);
          const oAmt     = sheet.getCell(rowIdx, startCol + 5);
          const oRemarks = sheet.getCell(rowIdx, startCol + 6);
          oDate.value    = new Date(r.date).toISOString().slice(0,10);
          oAmt.value     = r.amount;
          oRemarks.value = r.remarks ?? null;
          [oDate,oAmt,oRemarks].forEach(c=>c.border={ top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'} });
        });

        const blockEndRow = recHeaderRow + 1 + Math.max(ins.length, outs.length);
        const blockEndCol = startCol + 6;
        method.setOuterBorder(sheet, 1, blockEndRow, startCol, blockEndCol);

        startCol += 7 + gap;
      });

      sheet.columns.forEach(col => { let m=10; col.eachCell(cell => { m=Math.max(m,(cell.value||'').toString().length); }); col.width=m+2; });
    });

    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inventory_${new Date().toISOString().slice(0,10)}_${filter}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating Excel:', err);
    res.status(500).send('Server error');
  }
});

app.get('/accounts', async (req, res) => {
  try {
    const foundAccounts = await accounts.find().sort({ id: 1 }).select('-_id id username userLevel');
    res.json(foundAccounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not retrieve accounts.' });
  }
});
app.get("/currentAccount", async (req, res) => {
  let user = req.user;
  try {
    const account = await accounts.findOne({ id: user.id });
    if (!account)
      return res
        .status(404)
        .json({ message: "Account not found", redirect: "/" });

    const ok = user.password == account.password;
    if (!ok)
      return res
        .status(401)
        .send({ message: "Invalid credentials", redirect: "/" });

    res.status(200).json(account);
  } catch (err) {
    return res
      .status(404)
      .json({ message: "Invalid or expired token", redirect: "/" });
  }
});
app.post("/getAllSessions", async (req, res) => {
  try {
    let deviceId = req.session.device_id;
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({ error: "Account ID is required" });
    }

    const sessions = await loginSession.find({ target_id: accountId });

    const sessionsWithLocation = await Promise.all(
      sessions.map(async (session) => {
        try {
          const ipResponse = await fetch(
            `http://ip-api.com/json/${session.ip_address}`
          );
          const ipData = await ipResponse.json();
          return {
            currentSession: deviceId == session.device_id,
            session_id: session.session_id,
            ip_address: session.ip_address,
            location: `${ipData.city || "N/A"}, ${ipData.country || "N/A"}`,
            device_id: session.device_id,
          };
        } catch (err) {
          console.error(
            `Error fetching location for IP ${session.ip_address}:`,
            err
          );
          return {
            currentSession: deviceId == session.device_id,
            session_id: session.session_id,
            ip_address: session.ip_address,
            location: "Unknown",
            device_id: session.device_id,
          };
        }
      })
    );

    sessionsWithLocation.sort((a, b) => b.currentSession - a.currentSession);

    res.json({ loginSessions: sessionsWithLocation });
  } catch (error) {
    console.error("Error in /getAllSessions:", error);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/rawInventory", async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [foundProducts, foundStockRecords] = await Promise.all([
      products.find().lean(),
      stockRecords.find({ date: { $gte: since } }).lean(),
    ]);

    res.json({ products: foundProducts, stockRecords: foundStockRecords });
  } catch (err) {
    console.error("💥 Error in /rawInventory:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});
app.post("/getAccounts", async (req, res) => {
  try {
    // projection: only _id and username
    const list = await accounts.find({}, "id username").lean();
    // list will be an array of objects like [{ _id: "...", username: "..." }, …]
    console.log(list)
    res.status(200).json(list);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error", redirect: "/" });
  }
});
app.post("/getStockRecord", async (req, res) => {
  try {
    const { type } = req.query;
    const { id, days, limit } = req.body;

    const query = {};
    if (type === "single" && id) query.product_id = id;

    // If `days` is provided (e.g., last 30 days)
    if (days) {
      const since = moment().subtract(parseInt(days), "days").startOf("day");
      query.date = { $gte: since.toDate() };
    }

    // Fetch data based on query
    let findQuery = stockRecords.find(query).sort({ date: -1 });

    // If `limit` is provided
    if (limit) {
      findQuery = findQuery.limit(parseInt(limit));
    }

    const records = await findQuery;
    const data = records.map((r) => {
  const obj = r.toObject();
  const m = moment(r.date);

  // Check if the date is today
  const isToday = m.isSame(new Date(), 'day');

  // Format fromNow as "3m ago", "3h ago", "1d ago"
  const fromNow = m.fromNow().replace(' minutes', 'm').replace(' minute', 'm')
                                  .replace(' hours', 'h').replace('an hour', '1h')
                                  .replace(' days', 'd').replace('a day', '1d');

  return {
    ...obj,
    fromNow, // "3m ago", "3h ago", "1d ago"
    formattedDate: isToday ? m.format("hh:mm A") : m.format("MM/DD/YY hh:mm A"), // Show only time if today
    formattedTime: m.format("hh:mm A"), // 12-hour format with AM/PM
    formattedDateTime: isToday ? m.format("hh:mm A") : m.format("MM/DD/YY hh:mm A"), // Only show time if today, else full date & time
  };
});

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/getProduct", async (req, res) => {
  try {
    let type = req.query.type;
    if (type == "all") {
      const foundProducts = await products.find().sort({ name: 1 });
      res.json(foundProducts);
    } else if (type == "single") {
      const foundProduct = await products.findOne({ product_id: req.body.id });
      if (!foundProduct) return res.status(404).json({ error: "Product not found" });
      res.json(foundProduct);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/getCategory", async (req, res) => {
  try {
    let type = req.query.type;
    if (type == "all") {
      const foundCtg = await categories.find();
      res.json(foundCtg);
    } else if (type == "single") {
      const foundCtg = await categories.findOne({ category_id: req.body.id });
      res.json(foundCtg);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/getCategories", async (req, res) => {
  if (!req.user) return res.status(401).send({ message: "Not logged in", redirect: "/" });
  try {
    const foundCtg = await categories.find();
    res.json(foundCtg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/generateCategoryQr", async (req, res) => {
  try {
    const { category_id } = req.body;
    const category = await categories.findOne({ category_id });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // fetch and sort products by name
    const foundProducts = await products
      .find({ category_id })
      .sort({ name: 1 }) 
      .exec();   

    const rows = [];
    const perRow = 2;

    for (let i = 0; i < foundProducts.length; i += perRow) {
      // grab up to `perRow` products and pad with nulls
      const chunk = foundProducts.slice(i, i + perRow);
      while (chunk.length < perRow) chunk.push(null);

      const cells = await Promise.all(
        chunk.map(async (product) => {
          // empty slot
          if (!product) {
            return new TableCell({
              children: [],
              width: { size: 50, type: WidthType.PERCENTAGE },
            });
          }

          // generate & fetch QR
          const { imageUrl } = await method.generateQr(product.product_id+"-"+product.name);
          const response = await fetch(imageUrl);
          if (!response.ok) throw new Error("Failed to fetch QR image");
          const qrBuffer = await response.buffer();

          const image = new ImageRun({
            data: qrBuffer,
            transformation: { width: 150, height: 150 },
          });

          return new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [image],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [new TextRun({ text: product.name, bold: true })],
                alignment: AlignmentType.CENTER,
              }),
            ],
          });
        })
      );

      rows.push(new TableRow({ children: cells }));
    }

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: `LIST OF QR CODES | ${category.name.toUpperCase()}`,
              heading: "Heading1",
              alignment: AlignmentType.CENTER,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows,
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${category.name}_qr_codes.docx"`
    );
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate QR doc" });
  }
});
app.post("/createStockRecord", async (req, res) => {
  const { product_id, type, amount, author_id, remarks } = req.body;
  const delta = type === "IN" ? amount : -amount;
  let updatedProduct;

  try {
    if (type === "OUT") {
      // try atomic decrement only if enough stock
      updatedProduct = await products.findOneAndUpdate(
        { product_id, quantity: { $gte: amount } },
        { $inc: { quantity: delta } },
        { new: true }
      );

      if (!updatedProduct) {
        // the atomic update failed — now check why
        const productExists = await products.findOne({ product_id });
        if (!productExists) {
          return res
            .status(404)
            .json({ success: false, error: "Product not found" });
        } else {
          return res
            .status(400)
            .json({ success: false, error: "You don't have enough stocks" });
        }
      }
    } else {
      // IN-type: just increment
      updatedProduct = await products.findOneAndUpdate(
        { product_id },
        { $inc: { quantity: delta } },
        { new: true }
      );
      if (!updatedProduct) {
        return res
          .status(404)
          .json({ success: false, error: "Product not found" });
      }
    }

    // now record the transaction
    const newRecord = new stockRecords({
      product_id: product_id,
      type: type,
      amount: amount,
      remarks: remarks,
      author_id: Number(author_id),
    });
    await newRecord.save();

    io.emit("reload", { target: "product", product: updatedProduct });
    if (Number(author_id) === 2) {
      io.emit("reload", { target: "inventory" });
      io.emit("notify", {
        message: `An [${type}] record was added to ${updatedProduct.name}`,
        type: "info",
        duration: 5000,
      });
    }

    return res.status(201).json({
      success: true,
      message: `${type} record created and product quantity updated`,
      record: newRecord,
      product: updatedProduct,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.post('/createAccount', async (req, res) => {
  try {
    const { username, acc_level, password, confirm_password } = req.body;
    console.log(req.body);

    if (!username || !acc_level || !password || !confirm_password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (confirm_password !== password) {
      return res.status(400).json({ message: "Password confirmation do not match" });
    }

    const existing = await accounts.findOne({ username: username.toLowerCase() });

    if (existing) {
      return res.status(400).json({ message: "An account with same username already exists" });
    }

    // Get the highest existing ID
    const latestAccount = await accounts.findOne().sort({ id: -1 }).exec();
    const acc_id = latestAccount ? latestAccount.id + 1 : 1;

    const hashedPassword = await bcrypt.hash(password, 10);

    let newAcc = new accounts();
    newAcc.id = acc_id;
    newAcc.username = username.toLowerCase();
    newAcc.password = hashedPassword;
    newAcc.userLevel = Number(acc_level);

    await newAcc.save();

    res.status(201).json({ message: "Account created" });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Creations
app.post("/createProduct", async (req, res) => {
  try {
    let {
      product_name,
      product_min,
      product_max,
      product_category,
      product_expiry,
      product_expiry_unit,
      product_qty,
    } = req.body;

    product_min = Number(product_min);
    product_max = Number(product_max);
    product_qty = Number(product_qty) || 0;

    if (
      !product_name ||
      isNaN(product_min) ||
      isNaN(product_max) ||
      !product_category ||
      !product_expiry ||
      !product_expiry_unit
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (product_min >= product_max) {
      return res
        .status(400)
        .json({ message: "Max. Qty must be greater than Min. Qty" });
    }

    const existing = await products.findOne({ name: product_name });
    if (existing) {
      return res
        .status(400)
        .json({ message: "A Product with same name already exists!" });
    }

    const newProduct = new products(productsSchema);
    newProduct.product_id = method.genId();
    newProduct.name = product_name;
    newProduct.category_id = product_category;
    newProduct.quantity = product_qty;
    newProduct.min = product_min;
    newProduct.max = product_max;
    newProduct.expiry = product_expiry;
    newProduct.expiry_unit = product_expiry_unit;
    await newProduct.save();

    if (product_qty > 0) {
      const rec = new stockRecords({
        product_id: newProduct.product_id,
        type: "IN",
        amount: product_qty,
        date: new Date().toISOString(),
        author_id: 1,
      });
      await rec.save();
    }

    res.status(201).json({ message: "Product registered successfully!" });
  } catch (error) {
    console.error("Error registering product:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});
app.post("/createCategory", async (req, res) => {
  try {
    const { ctg_name } = req.body;

    const existingCategory = await categories.findOne({
      name: ctg_name.toLowerCase(),
    });

    if (existingCategory) {
      return res.status(400).json({ message: "This category already exists!" });
    }

    let newCat = new categories(categorySchema);
    newCat.name = ctg_name.toLowerCase();
    newCat.category_id = method.genId();

    await newCat.save();
    res.status(201).json({ message: "Category created successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/generateQr", async (req, res) => {
  try {
    const { product_id } = req.body;
    let generatedQr = await method.generateQr(product_id);
    console.log(generatedQr);
    res.status(201).json({ message: generatedQr.imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletions
app.delete("/removeSession", async (req, res) => {
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
app.delete('/accounts/:id', async (req, res) => {
  try {
    const accId = Number(req.params.id);
    if (accId === 1 || accId === 2) return res.status(403).json({ message: 'Cannot delete: this account is set by default.' });

    const deleted = await accounts.findOneAndDelete({ id: accId });
    if (!deleted) return res.status(404).json({ message: 'Account not found' });

    // Cascade delete login sessions
    await loginSession.deleteMany({ target_id: req.params.id });

    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete account.' });
  }
});
app.post("/deleteProduct", async (req, res) => {  
  const { product_id } = req.body;
  if (!product_id)
    return res.json({ success: false, error: "No product ID provided" });

  try {
    // Delete the product
    const result = await products.deleteOne({ product_id });

    if (result.deletedCount === 1) {
      // Delete all stock records for that product
      await stockRecords.deleteMany({ product_id });

      res.json({ success: true });
    } else {
      res.json({ success: false, error: "Product not found" });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Server error" });
  }
});
app.post("/deleteStockRecord", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "Missing record id" });
    }
    // Find record to adjust product quantity
    const rec = await stockRecords.findById(id);
    if (!rec) {
      return res
        .status(404)
        .json({ success: false, error: "Record not found" });
    }
    // Reverse the quantity change
    const delta = rec.type === "IN" ? -rec.amount : rec.amount;
    await products.findOneAndUpdate(
      { product_id: rec.product_id },
      { $inc: { quantity: delta } }
    );

    // Delete the record
    await stockRecords.deleteOne({ _id: id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.delete("/deleteCategory", async (req, res) => {
  try {
    const { catName } = req.body;
    if (!catName) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // 1) Find the category document
    const category = await categories.findOne({ name: catName });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // 2) Check if any product uses this category_id
    const inUse = await products.exists({ category_id: category.category_id });
    if (inUse) {
      return res.status(400).json({
        error:
          "Cannot delete — there are products associated with this category",
      });
    }

    // 3) Safe to delete
    await categories.deleteOne({ _id: category._id });
    return res.json({ message: "Category removed" });
  } catch (error) {
    console.error("Error in /deleteCategory:", error);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/updateProduct", async (req, res) => {  
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
app.delete("/deleteProduct/:id", async (req, res) => {
  try {
    await products.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Updates
app.put('/accounts/:id', async (req, res) => {
  try {
    const accId = Number(req.params.id);
    const update = { username: req.body.username, userLevel: req.body.userLevel };

    if (req.body.password) {
      update.password = await bcrypt.hash(req.body.password, 10);
    }

    const updated = await accounts.findOneAndUpdate({ id: accId }, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Account updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal error updating account.' });
  }
});
app.post('/updateAccount', async (req, res) => {
  const { accountData, formData } = req.body;
  
  let account = await accounts.findOne({ id: accountData.id })
  if (!account) return res.status(404).json({ message: "No account found" });
  account.username = formData.username.toLowerCase()
  
  if (!formData.password) {
    await account.save()
    return res.status(200).json({ message: 'Account updated successfully' });
  }
  
  const isMatch = await bcrypt.compare(formData.old_password, account.password);
  if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });
  
  if (formData.password !== formData.confirm_password) res.status(401).json({ message: 'New password conirmation did not match.' });
  
  const hashedPassword = await bcrypt.hash(formData.password, 10);
  account.password = hashedPassword
  await account.save()
  
  return res.status(200).json({ message: 'Account updated successfully' });
});
app.post("/editProduct", async (req, res) => {
  try {
    const { product_id, name, min, max, expiry, expiry_unit } = req.body;
    if (!product_id || typeof name !== "string" || min == null || max == null) {
      return res.status(400).json({ success: false, error: "Invalid payload" });
    }

    // find by _id (or adjust field if you use a different unique key)
    const doc = await products.findOneAndUpdate(
      { product_id: product_id },
      { name, min, max, expiry, expiry_unit },
      { new: true } // return the updated doc
    );

    if (min >= max) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Max. Qty must be greater than Min. Qty",
        });
    }

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Error updating product:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});
app.get("/test2", async (req, res) => {
  let doc = new accounts(accountsSchema);
  doc.id = 2;
  doc.username = "QR Scanner";
  doc.password = await bcrypt.hash("qrpass", 10);
  await doc.save();
  return doc;
});
app.get("/test3", async (req, res) => {
  try {
    const result = await stockRecords.updateMany(
      // match docs where author_id is either undefined or null
      { 
        $or: [
          { author_id: { $exists: false } },
          { author_id: null }
        ]
      },
      // set author_id to 1
      { $set: { author_id: 1 } }
    );

    res.status(200).json({
      message: "Update complete",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/test", async (req, res) => {
  try {
    const now = new Date();

    const samples = [
      {
        product_id: "Kq6QIcrQxDNLWcrdpezQ8k3zy6tq2PUn",
        type: "IN",
        amount: 50,
        date: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
      },
      {
        product_id: "Kq6QIcrQxDNLWcrdpezQ8k3zy6tq2PUn",
        type: "OUT",
        amount: 10,
        date: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
      },
      {
        product_id: "Kq6QIcrQxDNLWcrdpezQ8k3zy6tq2PUn",
        type: "IN",
        amount: 200,
        date: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
      },
      {
        product_id: "Kq6QIcrQxDNLWcrdpezQ8k3zy6tq2PUn",
        type: "OUT",
        amount: 5,
        date: new Date(now), // current time
      },
    ];

    const created = await stockRecords.insertMany(samples);

    res.json({
      message: `${created.length} sample records created.`,
      records: created,
    });
  } catch (err) {
    console.error("Error seeding stockRecords:", err);
    res.status(500).json({ error: err.message });
  }
});

// Server Connection
const PORT = process.env.PORT || 3000;

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});
server.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
