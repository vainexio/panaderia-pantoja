const color = {
  blue: "#91b2ff",
  yellow: "#ffe365",
  secondary_blue: "#7373fc",
  secondary_yellow: "#fdf468",
  red: "#ff3333",
  light_gray: "#e9ecef",
};
async function analyticsData() {
  try {
    const response = await fetch("/analyticsData", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch analytics data.");
    }
    const data = await response.json();

    const appointmentsByDayCtx = document
      .getElementById("appointmentsByDayChart")
      .getContext("2d");
    new Chart(appointmentsByDayCtx, {
      type: "bar",
      data: {
        labels: data.appointmentsByDay.map((item) => item.day),
        datasets: [
          {
            label: "Number of Appointments",
            data: data.appointmentsByDay.map((item) => item.count),
            backgroundColor: color.blue,
          },
        ],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
      },
    });

    const statusDistributionCtx = document
      .getElementById("statusDistributionChart")
      .getContext("2d");
    new Chart(statusDistributionCtx, {
      type: "pie",
      data: {
        labels: data.statusDistribution.map((item) => item.status),
        datasets: [
          {
            data: data.statusDistribution.map((item) => item.count),
            backgroundColor: [
              color.blue,
              color.yellow,
              color.secondary_blue,
              color.secondary_yellow,
            ],
          },
        ],
      },
      options: { responsive: true },
    });

    const timeScheduleCtx = document
      .getElementById("timeScheduleChart")
      .getContext("2d");
    new Chart(timeScheduleCtx, {
      type: "pie",
      data: {
        labels: data.timeScheduleDistribution.map((item) => item.schedule),
        datasets: [
          {
            data: data.timeScheduleDistribution.map((item) => item.count),
            backgroundColor: [color.blue, color.yellow],
          },
        ],
      },
      options: { responsive: true },
    });

    const appointmentsPerDoctorCtx = document
      .getElementById("appointmentsPerDoctorChart")
      .getContext("2d");
    new Chart(appointmentsPerDoctorCtx, {
      type: "bar",
      data: {
        labels: data.appointmentsPerDoctor.map((item) => item.doctor),
        datasets: [
          {
            label: "Appointments",
            data: data.appointmentsPerDoctor.map((item) => item.count),
            backgroundColor: color.blue,
          },
        ],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
      },
    });

    const appointmentReasonsCtx = document
      .getElementById("appointmentReasonsChart")
      .getContext("2d");
    new Chart(appointmentReasonsCtx, {
      type: "bar",
      data: {
        labels: data.appointmentReasons.map((item) => item.reason),
        datasets: [
          {
            label: "Count",
            data: data.appointmentReasons.map((item) => item.count),
            backgroundColor: color.blue,
          },
        ],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
      },
    });

    const appointmentTrendsCtx = document
      .getElementById("appointmentTrendsChart")
      .getContext("2d");
    new Chart(appointmentTrendsCtx, {
      type: "line",
      data: {
        labels: data.appointmentTrends.map((item) => item.month),
        datasets: [
          {
            label: "Appointments",
            data: data.appointmentTrends.map((item) => item.count),
            backgroundColor: color.blue,
            borderColor: color.yellow,
            fill: true,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
      },
    });
  } catch (err) {
    console.error("Error generating analytics:", err);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(analyticsData);
});
