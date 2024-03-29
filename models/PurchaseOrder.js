// models/PurchaseOrder.js

const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  referenceCode: { type: String, required: true },
  itemName: { type: String, required: true },
  pendingAmount: { type: Number, required: true },
  description: { type: String },
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);