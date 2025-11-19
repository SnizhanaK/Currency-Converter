# NBG Currency Converter

A lightweight browser-based currency converter that uses historical exchange rates from the National Bank of Georgia (NBG).  
No backend, no build tools — just open the page and use it.

## Features
- Loads official daily rates from the NBG public API
- Supports any currency pair, including conversions through GEL
- Multiple conversion rows with per-row results
- Summary panel with total amount
- Light/Dark theme toggle (saved in localStorage)
- Rate caching to reduce repeated API calls
- Responsive UI built with Vue 3 + Tailwind CSS

## Usage
1. Open `index.html` in any modern browser.
2. Enter an amount and pick a date.
3. Choose source and target currencies.
4. Press **Calculate all** to see results and the total.

> Note: If the selected date has no official rate (e.g., weekend or holiday), the API returns the most recent available rates.

## API
Rates are fetched from:  https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?date=YYYY-MM-DD

## Tech Stack
- Vue 3
- Tailwind CSS
- NBG Currencies API

## License
MIT