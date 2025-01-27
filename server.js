// app.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const json2xls = require('json2xls');
const XLSX = require('xlsx');

const ExcelJS = require('exceljs');
const fs = require('fs');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGOOSE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let doctorSchema = new mongoose.Schema({
  doctor_id: Number,
  first_name: String,
  last_name: String,
  contact_number: String,
  email: String,
  password: String,
})
let doctorAvailabilitySchema = new mongoose.Schema({
  availability_id: Number,
  doctor_id: Number,
  day_of_week: String,
  start_time: String,
  end_time: String,
})
let patientsSchema = new mongoose.Schema({
  patient_id: Number,
  first_name: String,
  last_name: String,
  sex: String,
  birthdate: String,
  contact_number: String,
  patient_type: String,
  email: String,
  password: String,
})
let medicalRecordsSchema = new mongoose.Schema({
  record_id: Number,
  patient_id: Number,
  doctor_id: Number,
  appointment_id: Number,
  diagnosis: String,
  treatment_plan: String,
  allergies: String,
  medical_history: String,
})
let appointmentsSchema = new mongoose.Schema({
  appointment_id: Number,
  patient_id: Number,
  doctor_id: Number,
  appointment_date: String,
  reason: String,
  status: String,
})

let doctors = mongoose.model('Doctors', doctorSchema);
let patients = mongoose.model('Patients', patientsSchema);
let medicalRecords = mongoose.model('Medical Records', medicalRecordsSchema);
let appointments = mongoose.model('Appointments', appointmentsSchema);
let availableDoctors = mongoose.model('Doctor Availability', doctorAvailabilitySchema);
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

app.post('/login', async (req, res) => {
  const { email, password, userType } = req.body;

  if (userType === 'doctor') {
    const doctor = await doctors.findOne({ email, password });
    if (doctor) {
      return res.json({ redirect: '/doctors.html', message: 'Login successful as Doctor' });
    }
  } else if (userType === 'patient') {
    const patient = await patients.findOne({ email, password });
    if (patient) {
      return res.json({ message: 'Login successful as Patient', user: patient });
    }
  }
  return res.status(401).json({ message: 'Invalid credentials or user type' });
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});