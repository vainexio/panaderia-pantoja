// app.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const json2xls = require('json2xls');
const fs = require('fs');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost/purchase_orders', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const purchaseOrderSchema = new mongoose.Schema({
  referenceCode: { type: String, required: true },
  itemName: { type: String, required: true },
  pendingAmount: { type: Number, required: true },
  description: { type: String },
});

let poSchema = new mongoose.Schema({
  referenceCode: String,
  itemName: String,
  pendingAmount: Number,
  description: String,
  })

let poModel = mongoose.model('PurchaseOrder', poSchema);

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
    console.log(orders);
    res.json(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/purchase-orders', async (req, res) => {
  try {
    const order = new poModel(poSchema)
    order.referenceCode = req.body.referenceCode
    order.itemName = req.body.order
    order.pendingAmount = req.body.pendingAmount
    order.description = req.body.description
    console.log(req.body)
    await order.save();
    res.status(201).send(order);
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