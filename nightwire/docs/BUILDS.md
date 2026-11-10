# NIGHTWIRE — Builds für Android, Windows und Linux

Alle Befehle laufen in `nightwire/`. Web-Build landet in `dist/`, alle Pakete in `release/` (beides in `.gitignore`).

| Ziel | Befehl | Ergebnis in `release/` | Voraussetzung |
|---|---|---|---|
| Web | `npm run build` | – (`dist/`) | Node ≥ 22.12 |
| Android Debug-APK | `npm run apk` | `nightwire-<v>-debug.apk` | JDK 21, Android SDK (Platform 36, Build-Tools 36) |
| Android Release-APK | `npm run apk:release` | `nightwire-<v>-release[-unsigned].apk` | wie oben, Signing optional |
| Android App Bundle | `npm run aab` | `nightwire-<v>-release[-unsigned].aab` | wie oben, für Play Store |
| Windows x64 portable | `npm run exe` | `nightwire-<v>-win-x64-portable.exe`, `nightwire-<v>-win-x64.zip` | läuft auch auf Linux ohne wine |
| Windows x64 Installer | `npm run exe:setup` | `nightwire-<v>-win-x64-setup.exe` | Windows-Host oder Linux mit wine |
| Linux x64 | `npm run linux` | `nightwire-<v>-linux-x86_64.AppImage`, `nightwire-<v>-linux-amd64.deb` | – |
| nur AppImage / nur deb | `npm run appimage` / `npm run deb` | wie oben | – |

Erstinstallation: `npm ci` (oder `npm install`). Electron-Binaries und NSIS/AppImage-Tools lädt electron-builder beim ersten Build selbst herunter.

## Tests

```bash
npm test            # quality + layout + build-config Self-Tests (ohne Netz, ohne SDK)
npm run build && npm run smoke            # Headless-Chrome: Boot, JACK IN, WebGL2, Konsolenfehler, Screenshot
npm run build && npm run smoke -- --mobile  # gleiches als Android-WebView-Emulation mit Touch
```

Desktop-Paket selbst prüfen (Linux, auch headless mit `xvfb-run`):

```bash
NIGHTWIRE_SMOKE=/tmp/nightwire-electron.png ./release/linux-unpacked/nightwire
```

Das Fenster lädt das Spiel, klickt JACK IN, schreibt Konsole und Zustand nach stdout, speichert einen Frame und beendet sich.

## Version

`package.json` → `version` ist die einzige Quelle. Android: `versionName` = Version, `versionCode` = `major*10000 + minor*100 + patch` (2.0.1 → 20001). `NIGHTWIRE_VERSION_CODE=<n>` überschreibt den Code, z. B. mit einer CI-Build-Nummer.

## Android

```bash
export JAVA_HOME=/pfad/zu/jdk-21
export ANDROID_HOME=$HOME/Android/Sdk
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"
npm run apk
adb install -r release/nightwire-2.0.1-debug.apk
```

`npm run apk*` baut das Web-Bundle, führt `cap sync android` aus (kopiert `dist/` nach `android/app/src/main/assets/public` und schreibt `capacitor.settings.gradle` für diesen Checkout neu) und ruft Gradle auf. Fehlt JDK oder SDK, endet der Befehl mit Exit 1 und nennt, was fehlt.

Native Integration (`MainActivity.java`, `AndroidManifest.xml`):

- Immersive Vollbild (System-Bars per Wischen einblendbar), Display-Cutout genutzt, Web-Layer polstert mit `env(safe-area-inset-*)`.
- `sensorLandscape`, Bildschirm bleibt an, solange das Spiel im Vordergrund ist.
- `android:isGame`, `appCategory="game"`, OpenGL ES 3.0 Pflicht (WebGL2), Touchscreen und Gamepad optional.
- App im Hintergrund → Spiel pausiert, Audio pausiert, gehaltene Touch-Eingaben werden gelöst.

### Release-Signing (nur über Umgebung, nie im Repo)

Variante A, Properties-Datei außerhalb des Repos:

```properties
# z. B. ~/.config/nightwire/keystore.properties
storeFile=/home/me/keys/nightwire-upload.jks
storePassword=...
keyAlias=nightwire
keyPassword=...
```

```bash
NIGHTWIRE_KEYSTORE_PROPERTIES=~/.config/nightwire/keystore.properties npm run aab
```

Variante B, direkt per Env: `NIGHTWIRE_KEYSTORE`, `NIGHTWIRE_KEYSTORE_PASSWORD`, `NIGHTWIRE_KEY_ALIAS`, `NIGHTWIRE_KEY_PASSWORD`.

Ohne beides entstehen `-unsigned`-Release-Pakete. Für den Play Store reicht ein mit dem Upload-Key signiertes AAB (Play App Signing). `*.jks`, `*.keystore` und `keystore.properties` sind in `.gitignore`.

## Windows

`npm run exe` erzeugt eine portable EXE (eine Datei, entpackt sich beim Start) und ein ZIP mit dem entpackten Ordner. Code-Signing und das Einbetten von Icon/Metadaten in die EXE sind aus (`signAndEditExecutable: false`), damit der Build auf Linux ohne wine läuft. Windows SmartScreen warnt deshalb beim ersten Start.

Zum Signieren auf Windows: `CSC_LINK` (Pfad/Base64 des .pfx) und `CSC_KEY_PASSWORD` setzen und in `electron-builder.yml` `signAndEditExecutable` entfernen.

`npm run exe:setup` baut den NSIS-Installer (Startmenü, Desktop-Verknüpfung, Deinstallation). electron-builder führt dazu den Installer einmal aus, um den Uninstaller zu erzeugen; auf Linux braucht das wine. Auf einem Windows-Rechner läuft der Befehl direkt.

## Linux

`npm run linux` erzeugt AppImage (läuft auf den meisten Distributionen ohne Installation: `chmod +x` und starten) und ein `.deb` (Debian/Ubuntu, installiert `/opt/NIGHTWIRE`, Startmenü-Eintrag `nightwire.desktop`, Befehl `nightwire`).

### Flatpak (Hinweis)

Ein Flatpak-Manifest liegt nicht im Repo und wurde nicht gebaut. Der übliche Weg wäre ein Manifest auf Basis von `org.electronjs.Electron2.BaseApp`, das den entpackten Linux-Build (`release/linux-unpacked/`) nach `/app` kopiert, Zugriff auf `--device=dri` (WebGL) und `--socket=pulseaudio` gibt und mit `flatpak-builder` gebaut wird. electron-builder hat zusätzlich ein `flatpak`-Target, das `flatpak` und `flatpak-builder` auf dem Build-Rechner voraussetzt.

## Desktop-Shell (Electron)

`electron/main.cjs` liefert `dist/` über das eigene Schema `app://nightwire/` aus. Dadurch funktionieren absolute Pfade wie `/assets/...`, Pointer Lock, Fullscreen und WebGL2 wie auf https.

- `contextIsolation`, `sandbox`, kein `nodeIntegration`. Die Preload-Bridge (`window.nightwireNative`) kann nur Vollbild umschalten und beenden.
- Berechtigungen: nur `pointerLock`, `fullscreen`, `keyboardLock`. Externe Links öffnen im System-Browser, Navigation aus dem Spiel heraus ist gesperrt.
- Einzelinstanz: ein zweiter Start fokussiert das laufende Fenster.
- `F11` oder `Alt+Enter` schalten Vollbild um, `--fullscreen` oder `NIGHTWIRE_FULLSCREEN=1` startet im Vollbild.
- Bildschirmschoner wird blockiert, solange das Fenster den Fokus hat. DevTools nur im Dev-Start oder mit `NIGHTWIRE_DEVTOOLS=1`.
- Lokal ohne Paket starten: `npx install-electron` (einmal), dann `npm run electron`.

## Hyperreal-Assets (Branch `hyperreal-assets`)

`npm run smoke` wartet jetzt auf den Asset-Pass (`window.__nightwire.assetsReady`, max. 90 s, `--asset-wait ms`)
und schlägt fehl, wenn eine Asset-Datei nicht lädt. `--query assets=0` prüft den prozeduralen Fallback,
neue Shots: `--shot robot|walk|drone`. Der Electron-Smoke (`NIGHTWIRE_SMOKE=...`) meldet ebenfalls `[smoke] assets {...}`.
Assets, Quellen und Lizenzen: `docs/ASSET-LICENSES.md`, Pipeline: `tools/asset-pipeline/README.md`.
