const API_ENDPOINT =
    "https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?date=";

const DEFAULT_FROM = "USD";
const DEFAULT_TO = "GEL";

const { createApp } = Vue;

createApp({
  data() {
    return {
      fromCurrency: DEFAULT_FROM,
      toCurrency: DEFAULT_TO,

      currencies: [],
      rateCache: {},

      rows: [{ amount: "", date: "", result: null }],
      summary: [],
      totalSum: null,
    };
  },

  mounted() {
    const today = new Date().toISOString().split("T")[0];
    this.rows[0].date = today;
    this.loadCurrenciesForToday(today);
  },

  methods: {
    format(num) {
      return Number(num).toFixed(2);
    },

    async loadCurrenciesForToday(date) {
      const rates = await this.fetchRates(date);
      this.currencies = Array.from(rates.keys()).map((code) => {
        const details = rates.get(code);
        return { code, name: details.name };
      });
    },

    async fetchRates(date) {
      if (this.rateCache[date]) return this.rateCache[date];

      const response = await fetch(`${API_ENDPOINT}${date}`);
      const data = await response.json();

      const entry = data[0];
      const map = new Map();

      entry.currencies.forEach((c) => {
        map.set(c.code, {
          name: c.name,
          rate: Number(c.rate),
          qty: Number(c.quantity),
        });
      });

      this.rateCache[date] = map;
      return map;
    },

    convertToGel(amount, currencyCode, ratesMap) {
      if (!amount || isNaN(amount)) return null;
      if (currencyCode === "GEL") return Number(amount);

      const details = ratesMap.get(currencyCode);
      const unit = details.rate / details.qty;
      return Number(amount) * unit;
    },

    addRow() {
      const today = new Date().toISOString().split("T")[0];
      this.rows.push({ amount: "", date: today, result: null });
    },

    removeRow(index) {
      if (this.rows.length > 1) this.rows.splice(index, 1);
    },

    async calculateAll() {
      const batchSummary = [];
      let batchTotal = 0;

      for (const row of this.rows) {
        if (!row.amount || !row.date) {
          row.result = null;
          continue;
        }

        const amount = Number(row.amount);
        if (!amount || amount <= 0) {
          row.result = null;
          continue;
        }

        try {
          const rates = await this.fetchRates(row.date);
          const resultGel = this.convertToGel(amount, this.fromCurrency, rates);

          if (resultGel == null || !isFinite(resultGel)) {
            row.result = null;
            continue;
          }

          row.result = resultGel;

          batchSummary.push({
            amount,
            date: row.date,
            result: resultGel,
          });

          batchTotal += resultGel;
        } catch (e) {
          console.error(e);
          row.result = null;
        }
      }

      if (batchSummary.length === 0) return;

      this.summary.push(...batchSummary);

      const prevTotal = this.totalSum ?? 0;
      this.totalSum = prevTotal + batchTotal;

      const today = new Date().toISOString().split("T")[0];
      this.rows = [{ amount: "", date: today, result: null }];
    },

    clearSummary() {
      this.summary = [];
      this.totalSum = null;
    },

    removeSummaryItem(index) {
      this.summary.splice(index, 1);
      this.totalSum =
          this.summary.length === 0
              ? null
              : this.summary.reduce((acc, item) => acc + item.result, 0);
    },
  },
}).mount("#app");