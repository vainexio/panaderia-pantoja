async function analyticsData () {
  try {
    const response = await fetch("/analyticsData", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch analytics data.");
    }
    const data = await response.json();

    // A. Appointments by Day (Bar Chart)
    const appointmentsByDayCtx = document.getElementById("appointmentsByDayChart").getContext("2d");
    new Chart(appointmentsByDayCtx, {
      type: "bar",
      data: {
        labels: data.appointmentsByDay.map(item => item.day),
        datasets: [{
          label: "Number of Appointments",
          data: data.appointmentsByDay.map(item => item.count),
          backgroundColor: "rgba(54, 162, 235, 0.6)"
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });

    // B. Appointment Status Distribution (Pie Chart)
    const statusDistributionCtx = document.getElementById("statusDistributionChart").getContext("2d");
    new Chart(statusDistributionCtx, {
      type: "pie",
      data: {
        labels: data.statusDistribution.map(item => item.status),
        datasets: [{
          data: data.statusDistribution.map(item => item.count),
          backgroundColor: [
            "rgba(255, 205, 86, 0.7)",
            "rgba(75, 192, 192, 0.7)",
            "rgba(54, 162, 235, 0.7)",
            "rgba(255, 99, 132, 0.7)"
          ]
        }]
      },
      options: { responsive: true }
    });

    // C. Time Schedule Distribution (Pie Chart)
    const timeScheduleCtx = document.getElementById("timeScheduleChart").getContext("2d");
    new Chart(timeScheduleCtx, {
      type: "pie",
      data: {
        labels: data.timeScheduleDistribution.map(item => item.schedule),
        datasets: [{
          data: data.timeScheduleDistribution.map(item => item.count),
          backgroundColor: [
            "rgba(153, 102, 255, 0.7)",
            "rgba(255, 159, 64, 0.7)"
          ]
        }]
      },
      options: { responsive: true }
    });

    // D. Appointments per Doctor (Bar Chart)
    const appointmentsPerDoctorCtx = document.getElementById("appointmentsPerDoctorChart").getContext("2d");
    new Chart(appointmentsPerDoctorCtx, {
      type: "bar",
      data: {
        labels: data.appointmentsPerDoctor.map(item => item.doctor),
        datasets: [{
          label: "Appointments",
          data: data.appointmentsPerDoctor.map(item => item.count),
          backgroundColor: "rgba(255, 206, 86, 0.6)"
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });

    // E. Appointment Reasons (Bar Chart)
    const appointmentReasonsCtx = document.getElementById("appointmentReasonsChart").getContext("2d");
    new Chart(appointmentReasonsCtx, {
      type: "bar",
      data: {
        labels: data.appointmentReasons.map(item => item.reason),
        datasets: [{
          label: "Count",
          data: data.appointmentReasons.map(item => item.count),
          backgroundColor: "rgba(75, 192, 192, 0.6)"
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });

    // F. Appointment Trends Over Time (Line Chart)
    const appointmentTrendsCtx = document.getElementById("appointmentTrendsChart").getContext("2d");
    new Chart(appointmentTrendsCtx, {
      type: "line",
      data: {
        labels: data.appointmentTrends.map(item => item.month),
        datasets: [{
          label: "Appointments",
          data: data.appointmentTrends.map(item => item.count),
          backgroundColor: "rgba(153, 102, 255, 0.4)",
          borderColor: "rgba(153, 102, 255, 1)",
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });

  } catch (err) {
    console.error("Error generating analytics:", err);
  }
};

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(analyticsData)
});