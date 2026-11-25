/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || path.join(os.homedir(), 'Android/Sdk');
const adb = path.join(sdk, 'platform-tools/adb');
const emulator = path.join(sdk, 'emulator/emulator');
const appId = 'app.transportescadiz';
const serial = process.env.BUSMOVIL_EMULATOR_SERIAL || 'emulator-5554';
const args = process.argv.slice(2);
const command = args.shift() || 'start';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const work = path.join(root, 'work');
const gpsState = path.join(work, `gps-${serial}.json`);
const gpsLock = path.join(work, `gps-${serial}.lock`);

function run(file, argv, options = {}) {
  const result = spawnSync(file, argv, { cwd: root, encoding: 'utf8', timeout: 120000, ...options });
  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message || result.stderr || result.stdout || `${file}: ${result.status}`);
  }
  return result.stdout?.trim() || '';
}
function device(...argv) {
  if (!/^emulator-\d+$/.test(serial)) throw new Error('El destino debe ser un emulador Android.');
  return run(adb, ['-s', serial, ...argv]);
}
function stops() {
  // Read the same stop catalogue used by the app, without maintaining duplicate coordinates.
  const ts = require('typescript');
  const Module = require('node:module');
  const filename = path.join(root, 'src/services/cadizApi.ts');
  const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  mod._compile(js, filename);
  return mod.exports.stopMetadata;
}
function coordinates(values) {
  if (values.length === 1) {
    const stop = stops()[values[0]];
    if (!stop || !Number.isFinite(stop.latitude) || !Number.isFinite(stop.longitude)) {
      throw new Error('Parada desconocida o sin coordenadas. Usa npm run emulator:stops.');
    }
    return { lat: stop.latitude, lon: stop.longitude, label: `${stop.stopId}: ${stop.label}` };
  }
  if (values.length !== 2 || values.some((v) => v.trim() === '')) throw new Error('Usa un ID de parada o latitud longitud.');
  const [lat, lon] = values.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new Error('Coordenadas inválidas: latitud [-90,90], longitud [-180,180].');
  }
  return { lat, lon, label: 'Coordenadas personalizadas' };
}
function gps(position) {
  device('shell', 'cmd', 'location', 'set-location-enabled', 'true');
  // The console expects LONGITUDE before LATITUDE, unlike the user command.
  const response = device('emu', 'geo', 'fix', String(position.lon), String(position.lat));
  if (/KO:/.test(response)) throw new Error(response);
  fs.mkdirSync(work, { recursive: true });
  const temp = `${gpsState}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(position));
  fs.renameSync(temp, gpsState);
  // Each candidate takes an exclusive lock; only one persistent feeder can run.
  const log = fs.openSync(path.join(work, `gps-${serial}.log`), 'a');
  const feeder = spawn(process.execPath, [__filename, 'feed'], {
    detached: true, stdio: ['ignore', log, log],
    env: { ...process.env, BUSMOVIL_EMULATOR_SERIAL: serial }
  });
  feeder.on('error', (error) => console.error(`No se pudo mantener el GPS: ${error.message}`));
  feeder.unref();
  fs.closeSync(log);
  console.log(`GPS ${serial}: ${position.label} (${position.lat}, ${position.lon}).`);
  console.log('Pulsa «Usar mi ubicación» en BusMovil para recalcular la parada cercana.');
  console.log('GPS continuo activo. Para usar los controles gráficos: npm run emulator:gps:stop.');
}
async function feed() {
  fs.mkdirSync(work, { recursive: true });
  if (fs.existsSync(gpsLock)) {
    try {
      const owner = Number(fs.readFileSync(path.join(gpsLock, 'pid'), 'utf8'));
      if (!Number.isInteger(owner) || owner <= 0) throw new Error('Lock inválido');
      process.kill(owner, 0);
      return;
    } catch (error) {
      if (error.code === 'ENOENT' && Date.now() - fs.statSync(gpsLock).mtimeMs < 5000) return;
      fs.rmSync(gpsLock, { recursive: true, force: true });
    }
  }
  try { fs.mkdirSync(gpsLock); } catch (error) {
    if (error.code === 'EEXIST') return;
    throw error;
  }
  fs.writeFileSync(path.join(gpsLock, 'pid'), String(process.pid));
  const cleanup = () => {
    if (fs.existsSync(path.join(gpsLock, 'pid')) &&
        fs.readFileSync(path.join(gpsLock, 'pid'), 'utf8') === String(process.pid)) {
      fs.rmSync(gpsLock, { recursive: true, force: true });
    }
  };
  process.once('exit', cleanup);
  process.once('SIGTERM', () => process.exit(0));
  process.once('SIGINT', () => process.exit(0));
  try {
    while (fs.existsSync(gpsState)) {
      if (run(adb, ['-s', serial, 'get-state'], { timeout: 5000 }) !== 'device') break;
      const position = JSON.parse(fs.readFileSync(gpsState, 'utf8'));
      run(adb, ['-s', serial, 'emu', 'geo', 'fix', String(position.lon), String(position.lat)], { timeout: 5000 });
      await delay(1000);
    }
  } catch (error) { console.error(`GPS detenido: ${error.message}`); }
  finally { cleanup(); }
}

async function start() {
  const position = coordinates(['1101']);
  const avds = run(emulator, ['-list-avds']).split(/\r?\n/).filter(Boolean);
  const avd = process.env.BUSMOVIL_AVD || avds[0];
  if (!avd || !avds.includes(avd)) throw new Error('No existe el AVD. Créalo en Android Studio > Device Manager, con Google Play y GPS.');
  let startupError;
  const devices = run(adb, ['devices']);
  if (!devices.split(/\r?\n/).some((line) => line.startsWith(`${serial}\t`))) {
    fs.mkdirSync(path.join(root, 'work'), { recursive: true });
    const log = fs.openSync(path.join(root, 'work/emulator.log'), 'a');
    const child = spawn(emulator, ['-avd', avd, '-port', serial.slice(9), '-no-snapshot-load', '-no-boot-anim', '-gpu', 'swiftshader_indirect', ...(args.includes('--headless') ? ['-no-window', '-no-audio'] : [])], {
      detached: true, stdio: ['ignore', log, log]
    });
    child.on('error', (error) => { startupError = error.message; });
    child.on('exit', (code) => { startupError = `El emulador se cerró (${code}). Revisa work/emulator.log.`; });
    child.unref();
    fs.closeSync(log);
    console.log(`Arrancando ${avd} (${serial}). Log: work/emulator.log`);
  }
  const deadline = Date.now() + 240000;
  let booted = false;
  while (Date.now() < deadline) {
    if (startupError) throw new Error(startupError);
    try {
      if (device('shell', 'getprop', 'sys.boot_completed') === '1') { booted = true; break; }
    } catch { /* ADB is not ready during boot. */ }
    await delay(2000);
  }
  if (!booted) throw new Error('El emulador no arrancó en 4 minutos. Revisa work/emulator.log.');
  if (!args.includes('--no-build')) {
    const jdk17 = path.join(os.homedir(), '.jdks/corretto-17.0.13');
    const env = { ...process.env, ANDROID_HOME: sdk };
    if (!env.JAVA_HOME && fs.existsSync(jdk17)) env.JAVA_HOME = jdk17;
    run(path.join(root, 'android/gradlew'), ['assembleRelease', '--console=plain', '--max-workers=2'], {
      cwd: path.join(root, 'android'), env, stdio: 'inherit', timeout: 600000
    });
  }
  const apk = path.join(root, 'android/app/build/outputs/apk/release/app-release.apk');
  if (!fs.existsSync(apk)) throw new Error('No existe el APK. Repite sin --no-build.');
  console.log(device('install', '-r', apk));
  device('shell', 'pm', 'grant', appId, 'android.permission.ACCESS_COARSE_LOCATION');
  device('shell', 'pm', 'grant', appId, 'android.permission.ACCESS_FINE_LOCATION');
  device('shell', 'input', 'keyevent', 'KEYCODE_WAKEUP');
  device('shell', 'wm', 'dismiss-keyguard');
  gps(position);
  console.log(device('shell', 'am', 'start', '-n', `${appId}/app.transportescadiz.MainActivity`));
  console.log('BusMovil listo en el emulador, sin Metro.');
}
async function main() {
  if (command !== 'stops' && !/^emulator-\d+$/.test(serial)) {
    throw new Error('El destino debe ser un emulador Android.');
  }
  if (command === 'stops') {
    for (const stop of Object.values(stops())) {
      if (Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)) console.log(`${stop.stopId}\t${stop.label}\t${stop.latitude}, ${stop.longitude}`);
    }
  } else if (command === 'gps') gps(coordinates(args));
  else if (command === 'start') await start();
  else if (command === 'feed') await feed();
  else if (command === 'gps-stop') fs.rmSync(gpsState, { force: true });
  else if (command === 'stop') {
    fs.rmSync(gpsState, { force: true });
    console.log(device('emu', 'kill'));
  }
  else throw new Error('Comandos: start [--no-build] [--headless], gps ID|LAT LON, stops, stop.');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
