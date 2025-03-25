// Nowy URL do danych JSON bez .setHeader()
const GOOGLE_WEBAPP_URL = "https://script.google.com/macros/s/AKfycby2Wb1x8R8jgzzod_BIpD73gETM_KvBfPCa1X3-w3lGpchnhKYAw8yGqWbjfVBlxAtZ0Q/exec";
const GOOGLE_DATA_JSON_URL = "https://script.google.com/macros/s/AKfycbyQLh60qAMv4oclJrMNxo0-ZPJbG6MsUNwQ5KSs0OHE6xPZeSCj1YZ1JZ2DpWr1oPY_dA/exec";

let sheetData = {};

const grid = document.getElementById("day-grid");
const title = document.getElementById("day-title");
const quote = document.getElementById("quote");
const affirmation = document.getElementById("affirmation");
const notes = document.getElementById("notes");
let activeDay = null;

function generateGrid() {
  for (let i = 1; i <= 30; i++) {
    const box = document.createElement("div");
    box.className = "day-box";
    box.textContent = i;
    box.setAttribute("data-day", i);

    const saved = localStorage.getItem(`reflection_day_${i}`);
    if (saved && saved.trim() !== "") {
      box.classList.add("completed");
    }

    box.onclick = () => loadDay(i, box);
    grid.appendChild(box);
  }
}

function loadDay(day, box) {
  document.querySelectorAll('.day-box').forEach(b => b.classList.remove('active'));
  box.classList.add('active');
  activeDay = day;

  title.textContent = `Dzień ${day}`;
  const row = sheetData[day];
  quote.textContent = row ? row.quote : "Brak cytatu.";
  affirmation.textContent = row ? row.affirmation : "Brak afirmacji.";
  notes.value = row && row.reflection ? row.reflection : "";
  notes.setAttribute("data-day", day);
}

function saveReflection() {
  const day = notes.getAttribute("data-day");
  if (!day) return alert("Najpierw wybierz dzień.");

  const reflection = notes.value;
  localStorage.setItem(`reflection_day_${day}`, reflection);

  const tile = document.querySelector(`.day-box[data-day='${day}']`);
  if (tile && reflection.trim() !== "") {
    tile.classList.add("completed");
  }

  fetch(GOOGLE_WEBAPP_URL, {
    method: "POST",
    body: JSON.stringify({ day, reflection }),
    headers: { "Content-Type": "application/json" }
  })
    .then(response => response.text())
    .then(data => {
      console.log("Zapisano w arkuszu:", data);
      const confirmation = document.createElement("span");
      confirmation.textContent = " ✅";
      confirmation.style.marginLeft = "10px";
      confirmation.style.color = "green";
      title.appendChild(confirmation);
      setTimeout(() => confirmation.remove(), 2000);
    })
    .catch(error => {
      console.error("Błąd zapisu do arkusza:", error);
      alert("Błąd zapisu do Google Sheets. Refleksja zapisana lokalnie.");
    });
}

function loadDataFromSheet() {
  fetch(GOOGLE_DATA_JSON_URL)
    .then(response => response.json())
    .then(json => {
      json.forEach(row => {
        const dayNumber = parseInt(row.day);
        if (dayNumber) {
          sheetData[dayNumber] = {
            quote: row.quote,
            affirmation: row.affirmation,
            reflection: row.reflection
          };
        }
      });
      generateGrid();

      const today = new Date().getDate();
      if (today <= 30) {
        const box = document.querySelector(`.day-box[data-day='${today}']`);
        if (box) loadDay(today, box);
      }
    })
    .catch(error => {
      console.error("Błąd wczytywania danych JSON:", error);
      alert("Nie udało się załadować danych z arkusza Google.");
    });
}

loadDataFromSheet();