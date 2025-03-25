// Odczyt z OpenSheet + zapis do Google Form bez CORS
const GOOGLE_FORM_ACTION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdGSbUCxz-9ZuMvQ0qvTM-0QO4wvMyj5y-iOcO3WjuUnnN31g/formResponse";
const FORM_DAY_FIELD = "entry.1329650917"; // Corrected mapping
const FORM_REFLECTION_FIELD = "entry.1903929725"; // Corrected mapping
const GOOGLE_DATA_JSON_URL = "https://opensheet.elk.sh/1mmT-N241s8owIc1_wKRaGvXQykTKnZhBOJaQk4uKHYM/PL";

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

  const saved = localStorage.getItem(`reflection_day_${day}`);
  notes.value = saved || (row && row.reflection ? row.reflection : "");
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

  // Zapisz do Google Form
  const formData = new FormData();
  formData.append(FORM_DAY_FIELD, day);
  formData.append(FORM_REFLECTION_FIELD, reflection);

  fetch(GOOGLE_FORM_ACTION_URL, {
    method: "POST",
    mode: "no-cors",
    body: formData
  })
    .then(() => {
      const confirmation = document.createElement("span");
      confirmation.textContent = " ✅";
      confirmation.style.marginLeft = "10px";
      confirmation.style.color = "green";
      title.appendChild(confirmation);
      setTimeout(() => confirmation.remove(), 2000);
    })
    .catch(error => {
      console.error("Błąd zapisu do Google Form:", error);
      alert("Błąd zapisu do formularza Google. Refleksja zapisana lokalnie.");
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