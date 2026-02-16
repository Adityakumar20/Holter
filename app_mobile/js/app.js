/**
 * Holter Pro | Wireless Web-BLE Dashboard
 * (c) 2026 Advanced ECG Systems
 */

// --- Configuration ---
const RN4871_SERVICE_UUID = '49535452-6564-6c6f-6261-6c5365727669';
const RN4871_WRITE_CHAR_UUID = '49535452-6564-6c6f-6261-6c536572766b';
const RN4871_READ_CHAR_UUID = '49535452-6564-6c6f-6261-6c536572766a';

// --- State Variables ---
let bleDevice = null;
let bleServer = null;
let writeChar = null;
let readChar = null;
let dataBuffer = "";
let sessions = [];
let isSyncing = false;

// --- Chart Setup ---
const ctx = document.getElementById('ecgChart').getContext('2d');
const ecgChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array(250).fill(''),
        datasets: [{
            label: 'ECG Signal',
            data: Array(250).fill(null),
            borderColor: '#00d2ff',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            fill: false
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: { display: false },
            y: {
                suggestedMin: 1100,
                suggestedMax: 1400,
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#888' }
            }
        },
        plugins: { legend: { display: false } }
    }
});

// --- UI Elements ---
const btnConnect = document.getElementById('btnConnect');
const connectionStatus = document.getElementById('connectionStatus');
const liveStats = document.getElementById('liveStats');
const liveFreq = document.getElementById('liveFreq');
const adcValue = document.getElementById('adcValue');
const btnSync = document.getElementById('btnSync');
const btnBulkRead = document.getElementById('btnBulkRead');
const btnErase = document.getElementById('btnErase');
const sessionList = document.getElementById('sessionList');
const liveIndicator = document.getElementById('liveIndicator');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');

// --- BLE Core ---
async function connect() {
    const VERSION = "1.3-STABLE";
    try {
        log(`[VER ${VERSION}] Requesting Bluetooth Device...`);
        // We will accept any device to ensure it shows up in the scan list
        bleDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [RN4871_SERVICE_UUID, '0000180a-0000-1000-8000-00805f9b34fb'] // Transparent UART + Dev Info
        });

        bleDevice.addEventListener('gattserverdisconnected', onDisconnected);

        log('Connecting to GATT Server...');
        bleServer = await bleDevice.gatt.connect();

        log('Getting Service...');
        const service = await bleServer.getPrimaryService(RN4871_SERVICE_UUID);

        log('Getting Characteristics...');
        writeChar = await service.getCharacteristic(RN4871_WRITE_CHAR_UUID);
        readChar = await service.getCharacteristic(RN4871_READ_CHAR_UUID);

        await readChar.startNotifications();
        readChar.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

        updateUIStatus(true);
        sendCmd("read"); // Automatic sync on connect

    } catch (error) {
        console.error('Connection failed:', error);
        // Showing detailed error to help the user debug
        alert(`Bluetooth Error: ${error.message}\n\nTips:\n1. Location (GPS) ON karein.\n2. Bluetooth permissions check karein.\n3. Make sure RN4871 is powered.`);
    }
}

function onDisconnected() {
    updateUIStatus(false);
    alert('Device Disconnected');
}

function handleCharacteristicValueChanged(event) {
    const value = new TextDecoder().decode(event.target.value);
    dataBuffer += value;

    // Process complete lines
    if (dataBuffer.includes('\n')) {
        const lines = dataBuffer.split('\n');
        dataBuffer = lines.pop(); // Keep the partial line

        lines.forEach(line => processLine(line.trim()));
    }
}

function processLine(line) {
    if (!line) return;

    if (line.startsWith("LIVE:")) {
        const val = parseInt(line.split(":")[1]);
        updateChart(val);
        adcValue.textContent = val;
        liveIndicator.classList.remove('hidden');
    } else if (line.startsWith("DEBUG_FS:")) {
        liveFreq.textContent = line.split(":")[1];
    } else if (line.includes("|") && !line.includes("ID |")) {
        // Session List Entry
        parseSessionItem(line);
    } else if (line === "CHIP_ERASE_COMPLETE") {
        hideOverlay();
        alert("Flash Memory Wiped!");
        sendCmd("read");
    } else if (line === "BULK_TRANSFER_START") {
        showOverlay("Downloading All Sessions...");
    } else if (line === "BULK_TRANSFER_END") {
        hideOverlay();
        alert("All sessions downloaded wirelessly!");
    } else {
        console.log("Device Output:", line);
    }
}

// --- Logic Helpers ---
function updateChart(val) {
    const data = ecgChart.data.datasets[0].data;
    data.push(val);
    if (data.length > 250) data.shift();
    ecgChart.update();
}

async function sendCmd(cmd) {
    if (!writeChar) return;
    try {
        const encoder = new TextEncoder();
        await writeChar.writeValueWithResponse(encoder.encode(cmd + "\n"));
    } catch (error) {
        console.error("Send command error:", error);
    }
}

function parseSessionItem(line) {
    const parts = line.split("|").map(p => p.trim());
    if (parts.length >= 3) {
        const sid = parts[0];
        const bytes = parts[2];
        const time = parts[3] || "N/A";
        addSessionToUI(sid, bytes, time);
    }
}

function addSessionToUI(id, bytes, time) {
    // Clear initial empty state
    if (sessionList.querySelector('.empty-state')) sessionList.innerHTML = '';

    // Check if item already exists
    if (document.getElementById(`sess-${id}`)) return;

    const div = document.createElement('div');
    div.className = 'session-item fade-in';
    div.id = `sess-${id}`;
    div.innerHTML = `
        <div class="session-info">
            <div class="sid">ECG SESSION #${id}</div>
            <div class="meta">${bytes} Bytes | ${time}</div>
        </div>
        <button onclick="downloadSession(${id})" class="btn-tiny">EXPORT</button>
    `;
    sessionList.prepend(div);
}

function downloadSession(id) {
    sendCmd(`read ${id}`);
}

// --- UI Sync ---
function updateUIStatus(connected) {
    if (connected) {
        btnConnect.textContent = "DISCONNECT";
        btnConnect.style.background = "#444";
        connectionStatus.textContent = "Connected";
        connectionStatus.className = "value connected";
        liveStats.classList.remove('hidden');
        [btnSync, btnBulkRead, btnErase].forEach(b => b.disabled = false);
    } else {
        btnConnect.textContent = "CONNECT DEVICE";
        btnConnect.style.background = "";
        connectionStatus.textContent = "Disconnected";
        connectionStatus.className = "value disconnected";
        liveStats.classList.add('hidden');
        liveIndicator.classList.add('hidden');
        [btnSync, btnBulkRead, btnErase].forEach(b => b.disabled = true);
        sessionList.innerHTML = '<div class="empty-state">Connect device to view sessions</div>';
    }
}

function showOverlay(text) {
    overlayText.textContent = text;
    overlay.classList.remove('hidden');
}

function hideOverlay() {
    overlay.classList.add('hidden');
}

function log(msg) { console.log(`[BLE] ${msg}`); }

// --- Event Listeners ---
btnConnect.addEventListener('click', () => {
    if (bleDevice && bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
    } else {
        connect();
    }
});

btnSync.addEventListener('click', () => {
    sessionList.innerHTML = '';
    sendCmd("read");
});

btnBulkRead.addEventListener('click', () => {
    sendCmd("read"); // Our bulk-read logic on BLE
});

btnErase.addEventListener('click', () => {
    if (confirm("DANGER: This will wipe all ECG recordings in Flash Memory. Proceed?")) {
        showOverlay("Wiping Flash...");
        sendCmd("erase");
    }
});
