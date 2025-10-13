# NBG Currency Converter

A lightweight web calculator for historical currency conversions based on the National Bank of Georgia (NBG) exchange rates. Enter an amount, choose a date, and select currencies to see the equivalent value in Georgian Lari or any other supported currency for that specific day.

## Features

- Fetches official daily exchange rates directly from the NBG public API.
- Remembers the last used currency pair via `localStorage` for faster subsequent calculations.
- Provides a responsive interface with accessibility-friendly semantics.
- Supports conversion between any two currencies by converting through the Georgian Lari base rate.

## Getting Started

1. Open `index.html` in any modern browser.
2. Enter the amount, choose the date, and select the source and target currencies.
3. Press **Convert** to view the converted amount alongside the Georgian Lari equivalent for tax or accounting purposes.

> **Tip:** If the selected date falls on a non-business day, the API may serve the most recent available rates. Ensure the displayed status message confirms the expected rate date.

## API Reference

Exchange rates are retrieved from the following NBG endpoint:

```
https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?date=YYYY-MM-DD
```

The application extracts the currency list from the JSON response and uses it to populate the selectors.

## License

This project is released under the [MIT License](./LICENSE).
