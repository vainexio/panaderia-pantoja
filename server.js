// app.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const json2xls = require('json2xls');
const XLSX = require('xlsx');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGOOSE, {
  useNewUrlParser: true,
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

app.post('/login', async (req, res) => {
  const { email, password, userType } = req.body;
  console.log(req.body)
  return res.status(401).json({ message: 'Invalid email or password' });
  // Manage login
  if (userType === 'doctor') {
    const doctor = await doctors.findOne({ email });
    if (doctor) {
      const isMatch = await bcrypt.compare(password, doctor.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      return res.json({ redirect: '/doctors.html', message: 'Login successful as Doctor' });
    }
  } 
  
  else if (userType === 'patient') {
    const patient = await patients.findOne({ email });
    if (patient) {
      const isMatch = await bcrypt.compare(password, patient.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      return res.json({ redirect: '/patients.html', message: 'Login successful as Patient' });
    }
  }
  return res.status(401).json({ message: 'Invalid email or password' });
});

const generatePatientId = async () => {
  let patientId;
  let isUnique = false;

  while (!isUnique) {
    patientId = Math.floor(100000 + Math.random() * 900000); 
    const existingPatient = await patients.findOne({ patient_id: patientId });
    if (!existingPatient) {
      isUnique = true;
    }
  }

  return patientId;
};

app.post('/registerPatient', async (req, res) => {
  try {
    const { first_name, last_name, email, password, sex, birthdate, contact_number, patient_type, confirm_password } = req.body;
    console.log(req.body)
    
    if (!first_name || !last_name || !email || !password || !sex || !birthdate || !contact_number || !patient_type || !confirm_password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    
    if (confirm_password !== password) {
      return res.status(400).json({ message: "Password confirmation do not match." });
    }

    // Check if patient with same name or email already exists
    const existingPatient = await patients.findOne({
      $or: [
        { first_name, last_name },
        { email }
      ]
    });

    if (existingPatient) {
      return res.status(400).json({ message: "Patient with same name or email already exists." });
    }

    // Generate a unique patient ID
    const patient_id = await generatePatientId();

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new patient
    const newPatient = new patients({
      patient_id,
      first_name,
      last_name,
      sex,
      birthdate,
      contact_number,
      patient_type,
      email,
      password: hashedPassword
    });

    // Save to database
    await newPatient.save();

    res.status(201).json({ message: "Patient registered successfully!" });
  } catch (error) {
    console.error("Error registering patient:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});