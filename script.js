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
            isDark: false,

            rows: [{ amount: "", date: "", result: null }],
            summary: [],
            totalSum: null,
        };
    },

    mounted() {
        const today = new Date().toISOString().split("T")[0];
        this.rows[0].date = today;
        this.loadCurrenciesForToday(today);

        const saved = localStorage.getItem("theme");
        this.isDark = saved === "dark";

        document.documentElement.classList.toggle("dark", this.isDark);
    },

    methods: {
        format(num) {
            if (num === null || num === undefined || num === "") return "";
            const n = Number(num);
            if (Number.isNaN(n)) return "";

            return new Intl.NumberFormat("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(n);
        },

        toggleTheme() {
            this.isDark = !this.isDark;
            localStorage.setItem("theme", this.isDark ? "dark" : "light");
            document.documentElement.classList.toggle("dark", this.isDark);
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

            const res = await fetch(`${API_ENDPOINT}${date}`);
            const data = await res.json();

            const map = new Map();
            data[0].currencies.forEach((c) => {
                map.set(c.code, {
                    name: c.name,
                    rate: Number(c.rate),
                    qty: Number(c.quantity),
                });
            });

            this.rateCache[date] = map;
            return map;
        },

        // универсальная конвертация from → to через GEL
        convert(amount, fromCode, toCode, ratesMap) {
            if (!amount || isNaN(amount)) return null;

            const value = Number(amount);

            if (fromCode === toCode) return value;

            const toGel = (val, code) => {
                if (code === "GEL") return val;
                const d = ratesMap.get(code);
                if (!d) return null;
                const perUnitGel = d.rate / d.qty;
                return val * perUnitGel;
            };

            const fromGel = (gelVal, code) => {
                if (code === "GEL") return gelVal;
                const d = ratesMap.get(code);
                if (!d) return null;
                const perUnitGel = d.rate / d.qty;
                return gelVal / perUnitGel;
            };

            const gelAmount = toGel(value, fromCode);
            if (gelAmount == null) return null;

            return fromGel(gelAmount, toCode);
        },

        addRow() {
            const today = new Date().toISOString().split("T")[0];
            this.rows.push({ amount: "", date: today, result: null });
        },

        removeRow(index) {
            if (this.rows.length > 1) this.rows.splice(index, 1);
        },

        async calculateAll() {
            const batch = [];
            let batchTotal = 0;

            for (const row of this.rows) {
                if (!row.amount || !row.date) continue;

                const amount = Number(row.amount);
                if (!amount || amount <= 0) continue;

                const rates = await this.fetchRates(row.date);
                const result = this.convert(
                    amount,
                    this.fromCurrency,
                    this.toCurrency,
                    rates
                );

                if (result == null) continue;

                row.result = result;

                batch.push({ amount, date: row.date, result });
                batchTotal += result;
            }

            if (batch.length === 0) return;

            this.summary.push(...batch);
            this.totalSum = (this.totalSum ?? 0) + batchTotal;

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
                    : this.summary.reduce((a, x) => a + x.result, 0);
        },
    },
}).mount("#app");