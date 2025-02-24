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
app.use(cors())

//
let currentPatient = null
let currentDoctor = {
  doctor_id: 1,
  first_name: "Juan",
  last_name: "Cruz",
  contact_number: "123-456-7890",
  email: "juancruz@gmail.com",
  password: "password1",
};

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
  emergency_contact_name: String,
  emergency_contact_number: String,
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
  appointment_day: String,
  appointment_time_schedule: String,
  reason: String,
  status: String,
})
const loginSessionSchema = new mongoose.Schema({
  session_id: String,
  ip_address: String,
  target_id: String,
  type: String,
  device_id: String,
});
const loginSession = mongoose.model('LoginSession', loginSessionSchema);
const patients = mongoose.model('Patients', patientsSchema);
const medicalRecords = mongoose.model('Medical Records', medicalRecordsSchema);
const appointments = mongoose.model('Appointments', appointmentsSchema);
const doctors = mongoose.model('Doctors', doctorSchema);
const availableDoctors = mongoose.model('Doctor Availability', doctorAvailabilitySchema);
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

app.get('/doctor-dashboard', async (req, res) => {
  res.sendFile(__dirname + '/public/doctors.html');
});
app.get('/patient-dashboard', async (req, res) => {
  res.sendFile(__dirname + '/public/patients.html');
});

/* Global Backend */
app.get('/currentAccount', async (req, res) => {
  let type = req.query.type;
  if (!type) return res.status(404).json({ message: "Invalid query type", redirect: "/" });
  
  // Device id
  let deviceId = req.cookies.deviceId;
  if (!deviceId) {
    deviceId = uuidv4();
    res.cookie('deviceId', deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }
  
  let currentSession = await fetch("https://bulldogs-care-center.glitch.me/session?type="+type, {
    headers: {
      cookie: req.headers.cookie || ""
    }
  });
  
  if (currentSession.ok) {
    currentSession = await currentSession.json();
    let sessionData = currentSession.session;
    
    let accountHolder = type == "doctor" ? doctors : type == "patient" ? patients : null
    if (!accountHolder) return res.status(404).json({ message: "Invalid account type", redirect: "/" });
    
    let queryField = type + "_id";
    console.log("Searching: ",queryField,sessionData.target_id,deviceId)
    let account = await accountHolder.findOne({ [queryField]: Number(sessionData.target_id) });
    if (account) return res.status(200).json(account);
    
    return res.status(404).json({ message: type+" not found.", redirect: "/" });
  } else {
    console.log(currentSession);
    return res.status(404).json({ message: "No login session was found.", redirect: "/" });
  }
});
app.post('/getAllSessions', async (req, res) => {
  try {
    let deviceId = req.cookies.deviceId;
    // Expecting the doctor's id in the request body
    const { accountId, type } = req.body;
    if (!accountId || !type) {
      return res.status(400).json({ error: 'Account ID & type is required' });
    }

    const sessions = await loginSession.find({ target_id: accountId, type: type });

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

    // Sort sessions so that the current session appears first
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
    const { accountId, type } = req.body;
    if (!accountId || !type) {
      return res.status(400).json({ error: "accountId & type is required" });
    }
    const result = await loginSession.deleteMany({ 
      target_id: accountId, 
      type, 
      device_id: { $ne: deviceId } 
    });
    return res.json({ message: `${result.deletedCount} session(s) removed` });
  } catch (error) {
    console.error("Error in /removeOtherSessions:", error);
    res.status(500).json({ error: "Server error" });
  }
});
app.post('/updateAccount', async (req, res) => {
  const { accountData, formData } = req.body;
  let accountHolder = formData.account_type == 'Doctor' ? doctors : formData.account_type == 'Patient' ? patients : null
  if (!accountHolder) return res.status(404).json({ message: "Invalid account type" });
  
  let account = await accountHolder.findOne({ email: accountData.email })
  if (!account) return res.status(404).json({ message: "No account found" });
  
  account.email = formData.email
  account.contact_number = formData.contact_number
  account.emergency_contact_name = formData.ec_name || ""
  account.emergency_contact_number = formData.ec_num || ""
  if (!formData.password) {
    await account.save()
    return res.status(200).json({ message: 'Account updated successfully' });
  }
  console.log(formData,await bcrypt.hash(formData.old_password, 10))
  const isMatch = await bcrypt.compare(formData.old_password, account.password);
  if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });
  
  if (formData.password !== formData.confirm_password) res.status(401).json({ message: 'New password conirmation did not match.' });
  
  const hashedPassword = await bcrypt.hash(formData.password, 10);
  account.password = hashedPassword
  await account.save()
  
  return res.status(200).json({ message: 'Account updated successfully' });
});
app.post('/login', async (req, res) => {
  const { email, password, userType } = req.body;
  
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
  if (ip.startsWith("::ffff:")) ip = ip.substring(7);
  const existingSession = await loginSession.findOne({ device_id: deviceId, type: userType });
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
      
      if (!existingSession) {
        const session = new loginSession({
          session_id: method.generateSecurityKey(),
          ip_address: ip,
          target_id: doctor.doctor_id,
          type: 'doctor',
          device_id: deviceId,
        });
        
        await session.save();
      } else if (existingSession) {
        existingSession.target_id = doctor.doctor_id
        existingSession.ip_address = ip
        existingSession.device_id = deviceId
        existingSession.type = "doctor"
        existingSession.session_id = method.generateSecurityKey()
        
        await existingSession.save();
      }
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
      
       if (!existingSession) {
        const session = new loginSession({
          session_id: method.generateSecurityKey(),
          ip_address: ip,
          target_id: patient.patient_id,
          type: 'patient',
          device_id: deviceId,
        });
        
        await session.save();
      } else if (existingSession) {
        existingSession.target_id = patient.patient_id
        existingSession.ip_address = ip
        existingSession.device_id = deviceId
        existingSession.type = "patient"
        existingSession.session_id = method.generateSecurityKey()
        
        await existingSession.save();
      }
      
      return res.json({ redirect: '/patient-dashboard', message: 'Login successful as Patient', key });
    }
  }
  
  return res.status(401).json({ message: 'Invalid email or password' });
});
app.get('/session', async (req, res) => {
  let deviceId = req.cookies.deviceId;
  if (!deviceId) {
    return res.status(401).json({ message: 'No device identifier found. Please log in.' });
  }
  
  try {
    const session = await loginSession.findOne({ device_id: deviceId, type: req.query.type });
    if (!session) return res.status(401).json({ message: 'Session not found. Please log in again.' });
    
    res.json({ message: 'Session valid', session });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
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

/* Doctor Backend */
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

    const existingPatient = await patients.findOne({
      $or: [
        { first_name, last_name },
        { email }
      ]
    });

    if (existingPatient) {
      return res.status(400).json({ message: "Patient with same name or email already exists." });
    }

    // UUID
    const patient_id = await generatePatientId();
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
app.get('/api/clinic-schedule', async (req, res) => {
  const ip = req.ip
  // Optionally normalize IPv6-mapped IPv4 addresses
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }
  console.log(ip,'for csched')
  try {
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();

    const weeks = method.computeCalendarWeeks(now);
    const availabilities = await availableDoctors.find({});
    const doctorAvailMap = {};

    for (const availability of availabilities) {
      const doctor = await doctors.findOne({ doctor_id: availability.doctor_id });
      const onDuty = method.checkIfOnDuty(availability);

      if (!doctorAvailMap[doctor.doctor_id]) {
        doctorAvailMap[doctor.doctor_id] = {
          doctor_id: doctor.doctor_id,
          doctor: doctor,
          availabilities: []
        };
      }

      doctorAvailMap[doctor.doctor_id].availabilities.push({
        availability_id: availability.availability_id,
        start_time: availability.start_time,
        end_time: availability.end_time,
        day_of_week: availability.day_of_week,
        onDuty: onDuty,
      });
    }
    const dayOrder = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7
    };

    for (const key in doctorAvailMap) {
      doctorAvailMap[key].availabilities.sort((a, b) => {
        return dayOrder[a.day_of_week] - dayOrder[b.day_of_week];
      });
    }

    const doctorAvailabilities = Object.values(doctorAvailMap);

    res.json({ currentMonth, currentYear, weeks, doctorAvailabilities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/schedule', async (req, res) => {
  const { day_of_week, start_time, end_time } = req.body;
  try {
    // Check if a schedule for this day already exists for the current doctor
    const existingSchedule = await availableDoctors.findOne({
      doctor_id: currentDoctor.doctor_id,
      day_of_week
    });
    
    if (existingSchedule) {
      return res.status(400).json({ message: 'Schedule for '+day_of_week+' already exists! Please try a different day.' });
    }
    
    // Convert times to 12-hour format
    const startTimeFormatted = method.convertTo12Hour(start_time);
    const endTimeFormatted = method.convertTo12Hour(end_time);

    let newSchedule = new availableDoctors({
      availability_id: Date.now(),
      doctor_id: currentDoctor.doctor_id,
      day_of_week,
      start_time: startTimeFormatted,
      end_time: endTimeFormatted,
    });

    await newSchedule.save();
    res.status(201).json(newSchedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/schedules', async (req, res) => {
  const ip = req.ip
  // Optionally normalize IPv6-mapped IPv4 addresses
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }
  console.log(ip,'for sched')
  try {
    let schedules = await availableDoctors.find({ doctor_id: currentDoctor.doctor_id });
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    schedules.sort((a, b) => {
      return daysOrder.indexOf(a.day_of_week) - daysOrder.indexOf(b.day_of_week);
    });
    
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/schedule/:id', async (req, res) => {
  try {
    await availableDoctors.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/schedule/:id', async (req, res) => {
  const { day_of_week, start_time, end_time } = req.body;
  try {
    // Convert times to 12-hour format
    const updatedStartTime = method.convertTo12Hour(start_time);
    const updatedEndTime = method.convertTo12Hour(end_time);

    let updatedSchedule = await availableDoctors.findByIdAndUpdate(
      req.params.id,
      { day_of_week, start_time: updatedStartTime, end_time: updatedEndTime },
      { new: true }
    );
    res.json(updatedSchedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Patient Backend */
app.post('/createAppointment', async (req, res) => {
  try {
    const { currentPatient, formData } = req.body;

    // Validate required information
    if (!currentPatient || !formData) {
      return res.status(400).json({ message: 'Missing required information' });
    }

    // Check appointment limit for morning and afternoon (limit: 10 per day)
    const scheduleLower = formData.schedule.toLowerCase();
    if (scheduleLower === 'morning' || scheduleLower === 'afternoon') {
      const count = await appointments.countDocuments({
        appointment_day: formData.day,
        appointment_time_schedule: formData.schedule
      });
      if (count >= 10) {
        return res.status(400).json({
          message: `Appointments fully booked for ${formData.schedule} on ${formData.day}`
        });
      }
    }

    // Find a doctor available on the selected day (using day_of_week)
    const availableDoctor = await availableDoctors.findOne({ day_of_week: formData.day });
    if (!availableDoctor) {
      return res.status(400).json({ message: 'No available doctor for this day' });
    }

    // Generate a random appointment_id (e.g., a 6-digit number)
    const appointmentId = Math.floor(Math.random() * 900000) + 100000;

    // Create new appointment document
    const newAppointment = new appointments({
      appointment_id: appointmentId,
      patient_id: currentPatient.patient_id,
      doctor_id: availableDoctor.doctor_id,
      appointment_day: formData.day,
      appointment_time_schedule: formData.schedule,
      reason: formData.reason,
      status: 'Pending Confirmation'
    });

    // Save the appointment to the database
    await newAppointment.save();

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: newAppointment
    });
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});