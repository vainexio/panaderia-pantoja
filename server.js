// app.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const json2xls = require('json2xls');
const XLSX = require('xlsx');
const bcrypt = require('bcrypt');
const fs = require('fs');
const cors = require('cors');

//
const method = require('./data/functions.js')
const settings = require('./data/settings.js')
const app = express();
app.use(cors())
// Connect to MongoDB
if (process.env.MONGOOSE) {
mongoose.connect(process.env.MONGOOSE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
}
let doctorSchema = new mongoose.Schema({
  doctor_id: Number,
  first_name: String,
  last_name: String,
  contact_number: String,
  email: String,
  password: String,
});
let doctorAvailabilitySchema = new mongoose.Schema({
  availability_id: Number,
  doctor_id: Number,
  day_of_week: String,
  start_time: String,
  end_time: String,
});
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
});
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

app.get('/doctor-dashboard', async (req, res) => {
  res.sendFile(__dirname + '/public/doctors.html');
});
app.get('/patient-dashboard', async (req, res) => {
  res.sendFile(__dirname + '/public/patients.html');
});

app.get('/getName', async (req, res) => {
  let query = req.query
  let id = query.id
  
  if (id == 1) {
    res.json({ firstName: "Nichole", lastName: "Quimpan"})
  } else {
    res.json({ error: "Invalid ID"})
  }
});

function generateSecurityKey(length = 32) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "";
    const cryptoObj = window.crypto || window.msCrypto; // For browser security

    if (cryptoObj && cryptoObj.getRandomValues) {
        const randomValues = new Uint8Array(length);
        cryptoObj.getRandomValues(randomValues);

        for (let i = 0; i < length; i++) {
            key += characters[randomValues[i] % characters.length];
        }
    } else {
        // Fallback if crypto API is not available
        for (let i = 0; i < length; i++) {
            key += characters.charAt(Math.floor(Math.random() * characters.length));
        }
    }
    return key;
}
app.post('/login', async (req, res) => {
  const { email, password, userType } = req.body;
  
  // Manage login
  if (userType === 'doctor') {
    const doctor = await doctors.findOne({ email });
    if (doctor) {
      const isMatch = await bcrypt.compare(password, doctor.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      let key = method.generateSecurityKey()
      settings.allowedKeys.push(key)
      return res.json({ redirect: '/doctor-dashboard', message: 'Login successful as Doctor', key });
    }
  }
  
  else if (userType === 'patient') {
    const patient = await patients.findOne({ email });
    if (patient) {
      const isMatch = await bcrypt.compare(password, patient.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      let key = method.generateSecurityKey()
      settings.allowedKeys.push(key)
      return res.json({ redirect: '/patient-dashboard', message: 'Login successful as Patient', key });
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

/* Clinic hours */
app.get('/api/clinic-schedule', async (req, res) => {
  try {
    // Get current date info
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();

    // Compute calendar weeks for the current month
    const weeks = computeCalendarWeeks(now);

    // Retrieve all availability records (could be multiple per doctor)
    const availabilities = await availableDoctors.find({});

    // Group availabilities by doctor_id to avoid duplicates
    const doctorAvailMap = {};

    for (const availability of availabilities) {
      // Get the doctor details from your doctors collection
      const doctor = await doctors.findOne({ doctor_id: availability.doctor_id });
      // Determine onDuty status using your method
      const onDuty = method.checkIfOnDuty(availability);

      // Initialize an entry in the map if this doctor hasn't been added yet
      if (!doctorAvailMap[doctor.doctor_id]) {
        doctorAvailMap[doctor.doctor_id] = {
          doctor_id: doctor.doctor_id,
          doctor: doctor,
          availabilities: []
        };
      }

      // Push this availability record to the doctor's array
      doctorAvailMap[doctor.doctor_id].availabilities.push({
        availability_id: availability.availability_id,
        start_time: availability.start_time,
        end_time: availability.end_time,
        day_of_week: availability.day_of_week,
        onDuty: onDuty,
      });
    }

    // Convert the map into an array of doctor availabilities
    const doctorAvailabilities = Object.values(doctorAvailMap);

    res.json({ currentMonth, currentYear, weeks, doctorAvailabilities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Helper function to compute calendar weeks for the current month
function computeCalendarWeeks(date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks = [];
  let week = new Array(7).fill('');
  let startDay = firstDay.getDay();
  let dayCounter = 1;

  // Fill first week
  for (let i = startDay; i < 7; i++) {
    week[i] = dayCounter++;
  }
  weeks.push(week);

  // Fill remaining weeks
  while (dayCounter <= lastDay.getDate()) {
    week = new Array(7).fill('');
    for (let i = 0; i < 7 && dayCounter <= lastDay.getDate(); i++) {
      week[i] = dayCounter++;
    }
    weeks.push(week);
  }
  return weeks;
}
//
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});