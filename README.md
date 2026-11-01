# My Bills

A personal bill tracker that installs to your phone's home screen (PWA). Bills are stored only on the device.

Recurring due dates are always calculated from a bill's first due date and frequency, so paying a quarterly or yearly bill never moves its schedule.

## Develop

```sh
npm install
npm run dev     # also reachable from your phone on the same Wi-Fi
npm test
npm run build
```

`npm run deploy` runs the tests, builds the app, and publishes it to the `gh-pages` branch, which GitHub Pages serves.

## Install on iPhone

Open the Pages URL in Safari, tap Share, then **Add to Home Screen**.
