// app.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const json2xls = require('json2xls');
const fs = require('fs');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGOOSE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let poSchema = new mongoose.Schema({
  referenceCode: String,
  itemName: String,
  pendingAmount: Number,
  deliveredAmount: Number,
  description: String,
  })

let poModel = mongoose.model('PurchaseOrder2', poSchema);

///////////////

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public', { // assuming your scripts.js file is in the 'public' folder
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'text/javascript');
    }
  }
}));

// Routes
app.get('/purchase-orders', async (req, res) => {
  try {
    const orders = await poModel.find();
    res.json(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Routes
app.get('/purchase-orders/:id', async (req, res) => {
  try {
    const order = await poModel.findOne({_id: req.params.id});
    res.json(order);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/purchase-orders', async (req, res) => {
  try {
    const order = new poModel(poSchema)
    order.referenceCode = req.body.referenceCode
    order.itemName = req.body.itemName
    order.pendingAmount = req.body.pendingAmount
    order.deliveredAmount = req.body.deliveredAmount
    order.description = req.body.description
    console.log(req.body)
    await order.save();
    
    const orders = await poModel.find();
    //res.json(order)
    res.status(201).send(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put('/purchase-orders/:id', async (req, res) => {
  try {
    const order = await poModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.send(order);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.delete('/purchase-orders/:id', async (req, res) => {
  try {
    await poModel.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/purchase-orders/download', async (req, res) => {
  try {
    const orders = await poModel.find();
    const xls = json2xls(orders);
    fs.writeFileSync('purchase_orders.xlsx', xls, 'binary');
    res.download('purchase_orders.xlsx');
  } catch (err) {
    res.status(500).send(err);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/generate-excel', async (req, res) => {
  try {
    const orders = await poModel.find();

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    // Define column headers
    worksheet.columns = [
      { header: 'Reference Code', key: 'referenceCode' },
      { header: 'Item Name', key: 'itemName' },
      { header: 'Pending Amount', key: 'pendingAmount' },
      { header: 'Delivered Amount', key: 'deliveredAmount' },
      { header: 'Description', key: 'description' },
      { header: 'Status', key: 'status' }
    ];

    // Add data to the worksheet
    orders.forEach(order => {
      worksheet.addRow({
        referenceCode: order.referenceCode,
        itemName: order.itemName,
        pendingAmount: order.pendingAmount,
        deliveredAmount: order.deliveredAmount,
        description: order.description,
        status: order.deliveredAmount - order.pendingAmount !== 0 ? 'Pending' : 'Completed'
      });
    });

    // Auto-size columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.header.length, ...column.values.map(value => value ? value.toString().length : 0)) + 2;
    });

    // Generate the Excel file
    const filePath = 'orders.xlsx';
    await workbook.xlsx.writeFile(filePath);

    // Send the Excel file as a response
    res.download(filePath);
  } catch (err) {
    console.error('Error generating Excel file:', err);
    res.status(500).send('Internal Server Error');
  }
});