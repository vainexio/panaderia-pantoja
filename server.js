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
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
} = require("docx");
//

const app = express();
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // Allow all origins (or restrict as needed)
});
//
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
//
const method = require("./data/functions.js");
const settings = require("./data/settings.js");
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
  date: { type: Date, default: Date.now },
  author_id: Number,
});
let categories = mongoose.model("Categories", categorySchema);
let accounts = mongoose.model("Accounts", accountsSchema);
let products = mongoose.model("Products", productsSchema);
let stockRecords = mongoose.model("Stock Records", stockRecordsSchema);
let loginSession = mongoose.model("LoginSession", loginSessionSchema);
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
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

app.use(
  express.static("public", {
    setHeaders: (res, path) => {
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "text/javascript");
      }
    },
  })
);
app.use((req, res, next) => {
  req.clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  next();
});
app.set("trust proxy", true);
app.use(cookieParser());
//
app.get("/ping", (req, res) => {
  if (!req.user) return res.status(401).send({ message: "Login session expired", redirect: "/" });
  return res.json({ pong: true, ts: Date.now() });
});
app.get("/admin-dashboard", async (req, res) => {
  res.sendFile(__dirname + "/public/admin.html");
});
/* Global Backend */
app.get('/download-inventory', async (req, res) => {
  try {
    // Fetch categories, products, and last 7 days of records
    const since = new Date(); since.setDate(since.getDate() - 7);
    const [allCats, allProds, allRecs] = await Promise.all([
      categories.find().lean(),
      products.find().lean(),
      stockRecords.find({ date: { $gte: since } }).lean(),
    ]);

    // Organize data
    const prodsByCat = allCats.reduce((acc, c) => {
      acc[c.category_id] = allProds.filter(p => p.category_id === c.category_id);
      return acc;
    }, {});
    const recsByProd = allRecs.reduce((acc, r) => {
      acc[r.product_id] = acc[r.product_id] || [];
      acc[r.product_id].push(r);
      return acc;
    }, {});
    const allProductsList = Object.values(prodsByCat).flat();
    const maxRecs = Math.max(0, ...allProductsList.map(p => (recsByProd[p.product_id]||[]).length));

    // Create workbook
    const wb = new ExcelJS.Workbook();
    wb.creator = 'YourApp'; wb.created = new Date();

    allCats.forEach(cat => {
      const sheet = wb.addWorksheet(cat.name || cat.category_id);

      // We'll lay out products side by side, starting at col 1
      let startCol = 1;
      const gap = 2; // blank columns between products

      prodsByCat[cat.category_id].forEach(p => {
        // --- Product Header ---
        sheet.mergeCells(1, startCol, 1, startCol + 3);
        const titleCell = sheet.getCell(1, startCol);
        titleCell.value = p.name;
        titleCell.font = { bold: true, size: 12 };
        // Add border around title
        ['top','left','bottom','right'].forEach(side => {
          titleCell.border = titleCell.border || {};
          titleCell.border[side] = { style: 'thin' };
        });

        // --- Details (row 2) ---
        const details = [ ['Quantity', p.quantity], ['Min', p.min], ['Max', p.max], ['Expiry', `${p.expiry} ${p.expiry_unit}`] ];
        details.forEach(([f, v], i) => {
          const cellLabel = sheet.getCell(2 + i, startCol);
          const cellVal   = sheet.getCell(2 + i, startCol + 1);
          cellLabel.value = f;
          cellVal.value   = v;
          // border
          [cellLabel, cellVal].forEach(cell => cell.border = { top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'} });
        });

        // --- Records Header (IN/OUT) start at row after details ---
        const recHeaderRow = 2 + details.length + 1;
        // IN header
        sheet.mergeCells(recHeaderRow, startCol, recHeaderRow, startCol + 1);
        const inHdr = sheet.getCell(recHeaderRow, startCol);
        inHdr.value = 'IN'; inHdr.fill = { type:'pattern',pattern:'solid',fgColor:{argb:'FFC6EFCE'} }; inHdr.font={bold:true};
        // OUT header
        sheet.mergeCells(recHeaderRow, startCol + 2, recHeaderRow, startCol + 3);
        const outHdr = sheet.getCell(recHeaderRow, startCol + 2);
        outHdr.value = 'OUT'; outHdr.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF2DCDB'}}; outHdr.font={bold:true};

        // Sub-headers Date/Amount
        const subRow = recHeaderRow + 1;
        ['Date','Amount'].forEach((h,i) => {
          const c1 = sheet.getCell(subRow, startCol + i);
          c1.value = h; c1.font={bold:true};
          const c2 = sheet.getCell(subRow, startCol + 2 + i);
          c2.value = h; c2.font={bold:true};
        });

        // --- FIFO Logic and record rows ---
        const ins = (recsByProd[p.product_id]||[]).filter(r=>r.type==='IN');
        const outs = (recsByProd[p.product_id]||[]).filter(r=>r.type==='OUT');
        let queue = ins.map(r=>({ date:new Date(r.date), amount:r.amount }));
        outs.forEach(o=>{
          let amt = o.amount;
          while(amt>0 && queue.length){
            if(queue[0].amount > amt) { queue[0].amount -= amt; amt=0; }
            else { amt -= queue[0].amount; queue.shift(); }
          }
        });
        
        ins.forEach((r,i) => {
          const rowIdx = subRow + 1 + i;
          const inDateCell = sheet.getCell(rowIdx, startCol);
          const inAmtCell  = sheet.getCell(rowIdx, startCol + 1);
          const statusCell = sheet.getCell(rowIdx, startCol + 2);

          inDateCell.value = new Date(r.date).toISOString().slice(0,10);
          inAmtCell.value  = r.amount;
          // expiry calculation
          const expDate = new Date(r.date);
          if(p.expiry_unit==='months') expDate.setMonth(expDate.getMonth()+p.expiry);
          else if(p.expiry_unit==='years') expDate.setFullYear(expDate.getFullYear()+p.expiry);
          else expDate.setDate(expDate.getDate()+p.expiry);

          if(queue.find(q=>q.date.getTime()===new Date(r.date).getTime())){
            statusCell.value = `Expires on ${expDate.toISOString().slice(0,10)}`;
          } else {
            statusCell.value = 'No longer on stock';
            [inDateCell, inAmtCell, statusCell].forEach(c=>c.font={color:{argb:'FFFF0000'}});
          }
          // border each
          [inDateCell,inAmtCell,statusCell].forEach(c=>c.border={top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}});
        });

        outs.forEach((r,i) => {
          const rowIdx = subRow + 1 + i;
          const outDateCell = sheet.getCell(rowIdx, startCol + 2);
          const outAmtCell  = sheet.getCell(rowIdx, startCol + 3);
          outDateCell.value = new Date(r.date).toISOString().slice(0,10);
          outAmtCell.value  = r.amount;
          [outDateCell,outAmtCell].forEach(c=>c.border={top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}});
        });

        // Expand a blank column gap
        startCol += 4 + gap;
      });

      // Auto-size all used columns
      sheet.columns.forEach(col => { let m=10; col.eachCell(cell=>{m=Math.max(m, (cell.value||'').toString().length)}); col.width=m+2; });
    });

    // Send workbook
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inventory_${new Date().toISOString().slice(0,10)}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch(err) {
    console.error('Error generating Excel:',err);
    res.status(500).send('Server error');
  }
});

app.get("/currentAccount", async (req, res) => {
  if (!req.user) return res.status(401).send({ message: "Not logged in", redirect: "/" });
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
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const remember = true;
  const ip = req.ip;
  const user = await accounts.findOne({ username });
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
  //res.send({ success: true });
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
app.delete("/removeOtherSessions", async (req, res) => {
  try {
    let deviceId = req.cookies.deviceId;
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({ error: "accountId is required" });
    }
    const result = await loginSession.deleteMany({
      target_id: accountId,
      device_id: { $ne: deviceId },
    });
    return res.json({ message: `${result.deletedCount} session(s) removed` });
  } catch (error) {
    console.error("Error in /removeOtherSessions:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Collect/Get
app.get("/api/raw-inventory", async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [foundProducts, foundStockRecords] = await Promise.all([
      products.find().lean(),
      stockRecords.find({ date: { $gte: since } }).lean(),
    ]);

    res.json({ products: foundProducts, stockRecords: foundStockRecords });
  } catch (err) {
    console.error("💥 Error in /api/raw-inventory:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});
app.post("/getAccounts", async (req, res) => {
  if (!req.user) 
    return res.status(401).send({ message: "Not logged in", redirect: "/" });

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
  if (!req.user)
    return res.status(401).send({ message: "Not logged in", redirect: "/" });

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

      return {
        ...obj,
        fromNow: m.fromNow(), // “3 hours ago”
        formattedDate: m.format("DD/MM/YY"), // “23/04/25”
        formattedTime: m.format("HH:mm"), // “14:07”
        formattedDateTime: m.format("DD/MM/YY HH:mm"), // “23/04/25 14:07”
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/getProduct", async (req, res) => {
  console.log(req.query,req.body)
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
  if (!req.user)
    return res.status(401).send({ message: "Not logged in", redirect: "/" });
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
  if (!req.user)
    return res.status(401).send({ message: "Not logged in", redirect: "/" });
  try {
    const foundCtg = await categories.find();
    res.json(foundCtg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
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
  const { product_id, type, amount, author_id } = req.body;
  // … your existing validation here …

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
            .json({ success: false, error: "Insufficient stock" });
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
      product_id,
      type,
      amount,
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

app.post("/createProduct", async (req, res) => {
  if (!req.user)
    return res.status(401).send({ message: "Not logged in", redirect: "/" });

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
  if (!req.user)
    return res.status(401).send({ message: "Not logged in", redirect: "/" });
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
  if (!req.user)
    return res.status(401).send({ message: "Not logged in", redirect: "/" });
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
app.post("/editProduct", async (req, res) => {
  try {
    const { product_id, name, min, max } = req.body;
    if (!product_id || typeof name !== "string" || min == null || max == null) {
      return res.status(400).json({ success: false, error: "Invalid payload" });
    }

    // find by _id (or adjust field if you use a different unique key)
    const doc = await products.findOneAndUpdate(
      { product_id: product_id },
      { name, min, max },
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
  // optional: ensure only logged-in users can trigger this
  if (!req.user) 
    return res.status(401).send({ message: "Not logged in", redirect: "/" });

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

// Start the server
const PORT = process.env.PORT || 3000;
/*app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
});*/
//

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});
server.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
