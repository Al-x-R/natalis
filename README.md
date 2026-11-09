# Natalis

Natal chart app: Expo (React Native) + Expo Router + TypeScript. Birth data form,
chart wheel, saved charts.

All calculations are done by a separate server,
[natalis-server](https://github.com/Al-x-R/natalis-server) (Fastify + Swiss Ephemeris,
AGPL-3.0). This repository contains no Swiss Ephemeris code; the app only calls the
server's HTTP API (`POST /chart`, `GET /geocode`). For local development, clone the
server next to this repository:

```
WebstormProjects/
  natalis/          this repository (app/)
  natalis-server/   the API server
```

The app credits Swiss Ephemeris, Open-Meteo/GeoNames, and OpenStreetMap, and links to
the server's source (bottom of the form screen; `EXPO_PUBLIC_SOURCE_URL` overrides the
link). That link is how users of the hosted server are told where its source is, which
the server's AGPL license requires, so keep it.

## App

```bash
cd app
npm install
npm run ios             # starts the API server (see below) + Expo on the iOS simulator
npm run android         # same for Android; `npm run start:all` = server + Expo without opening a device
npx expo start          # Expo only (press i / a, or scan the QR code with Expo Go)
npx expo start --web    # browser (date/time become text fields)
npm run typecheck && npx eslint src
```

The app calls the API at `EXPO_PUBLIC_API_URL` if set. Otherwise it uses the dev
machine's LAN address that Expo already knows, on port 3000. A phone running
Expo Go therefore reaches `npm run dev` with no configuration, as long as both are
on the same network. Example: `EXPO_PUBLIC_API_URL=http://192.168.1.10:3000 npx expo start`.

`npm run ios|android|start:all` reuse a server that is already running on port 3000.
Otherwise they start the one checked out next to this repository (`../natalis-server`,
or `NATALIS_SERVER_DIR`) and stop it when Expo exits. Set `API_PORT` to use a different port.

The project uses SDK 58, so the simulator or phone needs **Expo Go 58**. If the
simulator has an older Expo Go, `expo start --ios` asks
"Install the recommended Expo Go version?". Answer `y`.

All the libraries used (`react-native-svg`, `@react-native-community/datetimepicker`,
`@react-native-async-storage/async-storage`) are included in Expo Go.

Screens (`app/src/app/`):

- `index.tsx`: birth data form with date/time pickers, city autocomplete, and an optional manual UTC offset
- `chart.tsx`: SVG wheel (`src/components/ChartWheel.tsx`) plus planets, angles, houses, and aspects; offers an earlier/later choice for ambiguous DST times
- `saved.tsx`: charts saved in AsyncStorage, including results, so they open offline; long-press or tap «Удалить» to delete

### Adding a language

All strings live in `app/src/i18n/ru.ts`. Copy it to e.g. `en.ts` and translate it.
The `Strings` type makes TypeScript flag any missing key. Then register the file in
`app/src/i18n/index.ts`.
