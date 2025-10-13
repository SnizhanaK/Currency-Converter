const API_ENDPOINT = "https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?date=";
const LOCAL_STORAGE_KEYS = {
  fromCurrency: "nbgConverter.fromCurrency",
  toCurrency: "nbgConverter.toCurrency",
};

const DEFAULT_FROM = "USD";
const DEFAULT_TO = "GEL"; // National currency, not returned by API but used for conversion baseline.

const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const fromSelect = document.getElementById("from-currency");
const toSelect = document.getElementById("to-currency");
const statusBox = document.getElementById("status");
const resultBox = document.getElementById("result");

let currencyMap = new Map();

function formatDateForAPI(date) {
  return date.toISOString().split("T")[0];
}

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("error", isError);
}

function setResult(message) {
  resultBox.innerHTML = message;
}

function getSavedCurrency(key, fallback) {
  return localStorage.getItem(key) || fallback;
}

function saveCurrencySelections(fromCurrency, toCurrency) {
  localStorage.setItem(LOCAL_STORAGE_KEYS.fromCurrency, fromCurrency);
  localStorage.setItem(LOCAL_STORAGE_KEYS.toCurrency, toCurrency);
}

function populateCurrencyOptions() {
  const savedFrom = getSavedCurrency(LOCAL_STORAGE_KEYS.fromCurrency, DEFAULT_FROM);
  const savedTo = getSavedCurrency(LOCAL_STORAGE_KEYS.toCurrency, DEFAULT_TO);

  const fragment = document.createDocumentFragment();

  currencyMap.forEach((details, code) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = `${code} — ${details.name}`;
    fragment.appendChild(option);
  });

  fromSelect.innerHTML = "";
  toSelect.innerHTML = "";

  fromSelect.appendChild(fragment.cloneNode(true));
  toSelect.appendChild(fragment);

  // Add GEL manually for target currency selection
  if (!toSelect.querySelector("option[value='GEL']")) {
    const gelOption = document.createElement("option");
    gelOption.value = "GEL";
    gelOption.textContent = "GEL — Georgian Lari";
    toSelect.appendChild(gelOption);
  }

  if (!fromSelect.querySelector("option[value='GEL']")) {
    const gelOption = document.createElement("option");
    gelOption.value = "GEL";
    gelOption.textContent = "GEL — Georgian Lari";
    fromSelect.appendChild(gelOption);
  }

  fromSelect.value = currencyMap.has(savedFrom) || savedFrom === "GEL" ? savedFrom : DEFAULT_FROM;
  toSelect.value = currencyMap.has(savedTo) || savedTo === "GEL" ? savedTo : DEFAULT_TO;
}

function convertAmount(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const gelValue = convertToGel(amount, fromCurrency);
  return convertFromGel(gelValue, toCurrency);
}

function convertToGel(amount, currencyCode) {
  if (currencyCode === "GEL") {
    return amount;
  }

  const details = currencyMap.get(currencyCode);
  if (!details) {
    throw new Error(`Currency ${currencyCode} is not available for the selected date.`);
  }

  const ratePerUnit = details.rate / details.quantity;
  return amount * ratePerUnit;
}

function convertFromGel(amountGel, currencyCode) {
  if (currencyCode === "GEL") {
    return amountGel;
  }

  const details = currencyMap.get(currencyCode);
  if (!details) {
    throw new Error(`Currency ${currencyCode} is not available for the selected date.`);
  }

  const ratePerUnit = details.rate / details.quantity;
  return amountGel / ratePerUnit;
}

async function fetchCurrencies(date) {
  setStatus("Loading rates…");
  try {
    const response = await fetch(`${API_ENDPOINT}${date}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch rates: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Unexpected response format from API.");
    }

    const [entry] = data;
    if (!entry || !Array.isArray(entry.currencies)) {
      throw new Error("No currency data available for the selected date.");
    }

    currencyMap = new Map();
    entry.currencies.forEach((currency) => {
      currencyMap.set(currency.code, {
        name: currency.name,
        rate: Number(currency.rate),
        quantity: Number(currency.quantity),
      });
    });

    populateCurrencyOptions();
    setStatus(`Loaded ${currencyMap.size} currencies for ${entry.date.slice(0, 10)}.`);
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Unable to load currency list.", true);
  }
}

function handleFormSubmit(event) {
  event.preventDefault();

  const amount = Number(amountInput.value);
  const date = dateInput.value;
  const fromCurrency = fromSelect.value;
  const toCurrency = toSelect.value;

  if (Number.isNaN(amount) || amount <= 0) {
    setResult("<span>Please enter a valid amount greater than zero.</span>");
    return;
  }

  if (!date) {
    setResult("<span>Please choose a date.</span>");
    return;
  }

  try {
    const convertedAmount = convertAmount(amount, fromCurrency, toCurrency);
    const gelEquivalent = convertToGel(amount, fromCurrency);
    saveCurrencySelections(fromCurrency, toCurrency);

    const formattedConverted = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(convertedAmount);

    const formattedGel = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(gelEquivalent);

    setResult(
      `<strong>${formattedConverted} ${toCurrency}</strong>` +
        `<span>${amount} ${fromCurrency} was worth ${formattedGel} GEL on ${date}.</span>`
    );
  } catch (error) {
    console.error(error);
    setResult(`<span>${error.message}</span>`);
  }
}

function initializeDateField() {
  const today = new Date();
  const formattedToday = formatDateForAPI(today);
  dateInput.value = formattedToday;
}

async function init() {
  initializeDateField();
  const initialDate = dateInput.value;
  await fetchCurrencies(initialDate);
}

dateInput.addEventListener("change", (event) => {
  const selectedDate = event.target.value;
  if (selectedDate) {
    fetchCurrencies(selectedDate);
  }
});

fromSelect.addEventListener("change", () => {
  saveCurrencySelections(fromSelect.value, toSelect.value);
});

toSelect.addEventListener("change", () => {
  saveCurrencySelections(fromSelect.value, toSelect.value);
});

const form = document.getElementById("converter-form");
form.addEventListener("submit", handleFormSubmit);

init();
