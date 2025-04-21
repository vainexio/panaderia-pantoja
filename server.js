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


// Connect to MongoDB
if (process.env.MONGOOSE) {
mongoose.connect(process.env.MONGOOSE, {
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
  appointment_date: String,
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
const loginSession = mongoose.model('LoginSession', loginSessionSchema,"hatdog");
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
  console.log(req.clientIp)
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
app.get('/clinicSchedule', async (req, res) => {
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
  const { currentDoctor, day_of_week, start_time, end_time } = req.body;
  try {
    const existingSchedule = await availableDoctors.findOne({
      doctor_id: currentDoctor.doctor_id,
      day_of_week
    });
    
    if (existingSchedule) {
      return res.status(400).json({ message: 'Schedule for '+day_of_week+' already exists! Please try a different day.' });
    }
    
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
app.post('/schedules', async (req, res) => {
  let currentDoctor = req.body.currentDoctor
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
app.post('/getDoctorAppointments', async (req, res) => {
  const currentDoctor = req.body.currentDoctor;
  const statusFilter = req.body.statusFilter;
  const patientSearch = req.body.patientSearch;

  if (!currentDoctor || !currentDoctor.doctor_id) {
    return res.status(400).json({ message: "Invalid doctor data." });
  }

  try {
    const matchQuery = { doctor_id: currentDoctor.doctor_id };
    if (statusFilter && statusFilter !== 'All') {
      matchQuery.status = statusFilter;
    }

    const pipeline = [];
    pipeline.push({ $match: matchQuery });
    pipeline.push({
      $lookup: {
        from: "patients",
        localField: "patient_id",
        foreignField: "patient_id",
        as: "patient_info"
      }
    });
    pipeline.push({ $unwind: "$patient_info" });
    if (patientSearch && patientSearch.trim() !== "") {
      pipeline.push({
        $match: {
          $or: [
            { "patient_info.first_name": { $regex: patientSearch, $options: "i" } },
            { "patient_info.last_name": { $regex: patientSearch, $options: "i" } }
          ]
        }
      });
    }
    pipeline.push({
      $addFields: {
        daySort: {
          $switch: {
            branches: [
              { case: { $eq: ["$appointment_day", "Monday"] }, then: 1 },
              { case: { $eq: ["$appointment_day", "Tuesday"] }, then: 2 },
              { case: { $eq: ["$appointment_day", "Wednesday"] }, then: 3 },
              { case: { $eq: ["$appointment_day", "Thursday"] }, then: 4 },
              { case: { $eq: ["$appointment_day", "Friday"] }, then: 5 }
            ],
            default: 6
          }
        },
        scheduleSort: {
          $switch: {
            branches: [
              { case: { $eq: ["$appointment_time_schedule", "Morning"] }, then: 1 },
              { case: { $eq: ["$appointment_time_schedule", "Afternoon"] }, then: 2 }
            ],
            default: 3
          }
        }
      }
    });
    pipeline.push({ $sort: { daySort: 1, scheduleSort: 1 } });
    pipeline.push({ $project: { daySort: 0, scheduleSort: 0 } });

    const appointmentList = await appointments.aggregate(pipeline);
    const formattedAppointments = appointmentList.map(app => {
      return {
        appointment_id: app.appointment_id,
        patient_id: app.patient_id,
        patient_name: `${app.patient_info.first_name} ${app.patient_info.last_name}`,
        appointment_day: app.appointment_day,
        appointment_time_schedule: app.appointment_time_schedule,
        reason: app.reason,
        status: app.status,
        exact_date: app.appointment_date || "N/A"
      };
    });

    res.status(200).json({ appointments: formattedAppointments });
  } catch (err) {
    console.error("Error fetching doctor appointments", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.post('/updateAppointmentStatus', async (req, res) => {
  try {
    const { appointment_id, newStatus } = req.body;
    const allowedStatuses = ["Pending", "Completed", "Cancelled"];
    if (!appointment_id || !newStatus || !allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ message: "Invalid input" });
    }
    const updated = await appointments.findOneAndUpdate(
      { appointment_id },
      { status: newStatus },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json({ message: "Appointment status updated", appointment: updated });
  } catch (err) {
    console.error("Error updating appointment status:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.post('/startAppointment', async (req, res) => {
  try {
    const { appointment_id } = req.body;
    if (!appointment_id) {
      return res.status(400).json({ message: "Appointment ID is required" });
    }
    const appointmentDetail = await appointments.aggregate([
      { $match: { appointment_id: Number(appointment_id) } },
      {
        $lookup: {
          from: "patients",
          localField: "patient_id",
          foreignField: "patient_id",
          as: "patient_info"
        }
      },
      { $unwind: "$patient_info" }
    ]);
    console.log(appointmentDetail)
    if (!appointmentDetail || appointmentDetail.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    const appointment = appointmentDetail[0];
    let record = await medicalRecords.findOne({ appointment_id: appointment_id });
    
    res.status(200).json({
      message: "Appointment started",
      appointment: {
        appointment_id: appointment.appointment_id,
        patient_id: appointment.patient_id,
        patient_name: `${appointment.patient_info.first_name} ${appointment.patient_info.last_name}`,
        sex: appointment.patient_info.sex,
        birthdate: appointment.patient_info.birthdate,
        emergency_contact: `${appointment.patient_info.emergency_contact_name || "None"} - ${appointment.patient_info.emergency_contact_number || "None"}`,
        contact_number: appointment.patient_info.contact_number,
        email: appointment.patient_info.email,
      },
      medicalRecord: record || null
    });
  } catch (err) {
    console.error("Error starting appointment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.post('/saveMedicalRecord', async (req, res) => {
  try {
    const { appointment_id, patient_id, doctor_id, diagnosis, treatment_plan, allergies, medical_history } = req.body;
    if (!appointment_id || !patient_id || !doctor_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    // Check if a record exists
    let record = await medicalRecords.findOne({ appointment_id: appointment_id });
    if (record) {
      // Update existing
      record.diagnosis = diagnosis;
      record.treatment_plan = treatment_plan;
      record.allergies = allergies;
      record.medical_history = medical_history;
      await record.save();
      res.status(200).json({ message: "Medical record updated", record });
    } else {
      // Create new
      const record_id = Math.floor(Math.random() * 900000) + 100000;
      const newRecord = new medicalRecords({
        record_id,
        appointment_id,
        patient_id,
        doctor_id,
        diagnosis,
        treatment_plan,
        allergies,
        medical_history
      });
      await newRecord.save();
      res.status(201).json({ message: "Medical record created", record: newRecord });
    }
  } catch (err) {
    console.error("Error saving medical record:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.post('/getPatientHistory', async (req, res) => {
  const currentDoctor = req.body.currentDoctor;
  if (!currentDoctor || !currentDoctor.doctor_id) {
    return res.status(400).json({ message: "Invalid doctor data." });
  }

  try {
    const history = await appointments.aggregate([
      { 
        $match: { 
          doctor_id: currentDoctor.doctor_id, 
          status: "Completed"
        } 
      },
      {
        $lookup: {
          from: "patients",
          localField: "patient_id",
          foreignField: "patient_id",
          as: "patient_info"
        }
      },
      { $unwind: "$patient_info" },
      {
        $lookup: {
          from: "medical records",
          localField: "appointment_id",
          foreignField: "appointment_id",
          as: "medicalRecord"
        }
      },
      // Group by patient
      {
        $group: {
          _id: "$patient_id",
          patient: { $first: "$patient_info" },
          appointments: {
            $push: {
              appointment_id: "$appointment_id",
              appointment_day: "$appointment_day",
              appointment_time_schedule: "$appointment_time_schedule",
              appointment_date: "$appointment_date",
              reason: "$reason",
              status: "$status",
              medicalRecord: { $arrayElemAt: ["$medicalRecord", 0] }
            }
          }
        }
      }
    ]);

    const formattedHistory = history.map(item => ({
      patient_id: item._id,
      name: `${item.patient.first_name} ${item.patient.last_name}`,
      sex: item.patient.sex,
      birthdate: item.patient.birthdate,
      contact_number: item.patient.contact_number,
      email: item.patient.email,
      emergency_contact_name: item.patient.emergency_contact_name,
      emergency_contact_number: item.patient.emergency_contact_number,
      appointments: item.appointments
    }));

    res.status(200).json({ patients: formattedHistory });
  } catch (err) {
    console.error("Error fetching patient history", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* Patient Backend */
app.post('/createAppointment', async (req, res) => {
  try {
    const { currentPatient, formData } = req.body;

    if (!currentPatient || !formData) {
      return res.status(400).json({ message: 'Missing required information' });
    }

    const existingAppointment = await appointments.findOne({
      patient_id: currentPatient.patient_id,
      status: "Pending"
    });
    if (existingAppointment) {
      return res.status(400).json({ message: 'You already have a pending appointment.' });
    }

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

    const availableDoctor = await availableDoctors.findOne({ day_of_week: formData.day });
    if (!availableDoctor) {
      return res.status(400).json({ message: 'No available doctor for this day' });
    }

    const dayMapping = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5 };
    const targetDay = dayMapping[formData.day];
    if (!targetDay) {
      return res.status(400).json({ message: 'Invalid appointment day' });
    }

    const today = new Date();
    const currentDay = today.getDay();
    let diff = targetDay - currentDay;
    if (diff <= 0) {
      diff += 7;
    }
    const appointmentDateObj = new Date();
    appointmentDateObj.setDate(today.getDate() + diff);

    // Format appointment date
    const mm = (appointmentDateObj.getMonth() + 1).toString().padStart(2, '0');
    const dd = appointmentDateObj.getDate().toString().padStart(2, '0');
    const yyyy = appointmentDateObj.getFullYear();
    const formattedDate = `${mm}/${dd}/${yyyy}`;

    const appointmentId = Math.floor(Math.random() * 900000) + 100000;
    const newAppointment = new appointments({
      appointment_id: appointmentId,
      patient_id: currentPatient.patient_id,
      doctor_id: availableDoctor.doctor_id,
      appointment_day: formData.day,
      appointment_date: formattedDate,
      appointment_time_schedule: formData.schedule,
      reason: formData.reason,
      status: 'Pending'
    });

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
app.post('/appointments', async (req, res) => {
  const currentPatient = req.body.currentPatient;

  if (!currentPatient || !currentPatient.patient_id) {
    return res.status(400).json({ error: "Invalid patient data." });
  }

  try {
    const appointmentList = await appointments.aggregate([
      {
        $match: { patient_id: currentPatient.patient_id } // Filter by current patient's ID
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctor_id",
          foreignField: "doctor_id",
          as: "doctor_info"
        }
      },
      {
        $unwind: "$doctor_info"
      }
    ]);

    const formattedAppointments = appointmentList.map(app => {
      return {
        appointment_id: app.appointment_id,
        patient_id: app.patient_id,
        doctor_id: app.doctor_id,
        doctor_name: `${app.doctor_info.first_name} ${app.doctor_info.last_name}`,
        appointment_day: app.appointment_day,
        appointment_time_schedule: app.appointment_time_schedule,
        reason: app.reason,
        status: app.status,
        exact_date: app.appointment_date || "N/A"
      };
    });

    res.status(200).json({ appointments: formattedAppointments });
  } catch (err) {
    console.error("Error fetching appointments", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.delete('/cancelAppointment/:appointmentId', async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.appointmentId);
    const appointment = await appointments.findOne({ appointment_id: appointmentId });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.status !== 'Pending' && appointment.status !== 'Cancelled') {
      return res.status(400).json({ message: 'Only pending/cancelled appointments can be deleted' });
    }
    await appointments.deleteOne({ appointment_id: appointmentId });
    res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.post('/getPatientMedicalHistory', async (req, res) => {
  const currentPatient = req.body.currentPatient;
  if (!currentPatient || !currentPatient.patient_id) {
    return res.status(400).json({ message: "Invalid patient data." });
  }
  try {
    const appointmentsHistory = await appointments.aggregate([
      { $match: { 
        patient_id: currentPatient.patient_id ,
        status: "Completed"
      } },
      {
        $lookup: {
          from: "doctors",
          localField: "doctor_id",
          foreignField: "doctor_id",
          as: "doctor_info"
        }
      },
      { $unwind: "$doctor_info" },
      {
        $lookup: {
          from: "medical records",
          localField: "appointment_id",
          foreignField: "appointment_id",
          as: "medicalRecord"
        }
      },
      {
        $addFields: {
          medicalRecord: { $arrayElemAt: ["$medicalRecord", 0] }
        }
      },
      { $sort: { appointment_day: 1, appointment_time_schedule: 1 } }
    ]);
    res.status(200).json({ appointments: appointmentsHistory });
  } catch (err) {
    console.error("Error fetching patient medical history", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.post('/analyticsData', async (req, res) => {
  try {
    const appointmentsByDayAgg = await appointments.aggregate([
      {
        $group: {
          _id: "$appointment_day",
          count: { $sum: 1 }
        }
      }
    ]);
    const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const appointmentsByDay = daysOrder.map(day => {
      const found = appointmentsByDayAgg.find(item => item._id === day);
      return { day, count: found ? found.count : 0 };
    });

    const statusDistributionAgg = await appointments.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    const statusDistribution = statusDistributionAgg.map(item => ({
      status: item._id,
      count: item.count
    }));

    const timeScheduleAgg = await appointments.aggregate([
      {
        $group: {
          _id: "$appointment_time_schedule",
          count: { $sum: 1 }
        }
      }
    ]);
    const timeScheduleDistribution = timeScheduleAgg.map(item => ({
      schedule: item._id,
      count: item.count
    }));

    const appointmentsPerDoctorAgg = await appointments.aggregate([
      {
        $group: {
          _id: "$doctor_id",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "doctor_id",
          as: "doctor"
        }
      },
      { $unwind: "$doctor" }
    ]);
    const appointmentsPerDoctor = appointmentsPerDoctorAgg.map(item => ({
      doctor: `Dr. ${item.doctor.first_name} ${item.doctor.last_name}`,
      count: item.count
    }));

    const appointmentReasonsAgg = await appointments.aggregate([
      {
        $group: {
          _id: "$reason",
          count: { $sum: 1 }
        }
      }
    ]);
    const appointmentReasons = appointmentReasonsAgg.map(item => ({
      reason: item._id,
      count: item.count
    }));
    const appointmentTrendsAgg = await appointments.aggregate([
      {
        $addFields: {
          appointmentDateObj: {
            $dateFromString: {
              dateString: "$appointment_date",
              format: "%m/%d/%Y"
            }
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%m/%Y", date: "$appointmentDateObj" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const appointmentTrends = appointmentTrendsAgg.map(item => ({
      month: item._id,
      count: item.count
    }));

    res.status(200).json({
      appointmentsByDay,
      statusDistribution,
      timeScheduleDistribution,
      appointmentsPerDoctor,
      appointmentReasons,
      appointmentTrends
    });
  } catch (err) {
    console.error("Error generating analytics data", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});