const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Statische Daten (Simulation einer Datenbank)
const USERS = {
    'LS_MITTE': { pass: 'LST-Mitte-2026!#Secure-Alpha-99', role: 'dispatcher', name: 'Leitstelle Mitte' },
    'HLF_1': { pass: 'HLF1_Safe_XJ-927#Kilo-Delta', role: 'vehicle', name: 'Florian Mitte 1-HLF20-1', status: 2 },
    'HLF_2': { pass: 'HLF2_Prot_ZW-114#Echo-Sierra', role: 'vehicle', name: 'Florian Mitte 1-HLF20-2', status: 2 },
    'HLF_3': { pass: 'HLF_3_Sec_QM-552#Tango-Victor', role: 'vehicle', name: 'Florian Mitte 1-HLF20-3', status: 2 },
    'HLF_4': { pass: 'HLF_4_Guard_RB-008#Bravo-Zulu', role: 'vehicle', name: 'Florian Mitte 1-HLF20-4', status: 2 }
};

let activeEinsaetze = [];

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('Verbindung:', socket.id);

    socket.on('login', (data) => {
        const userData = USERS[data.user];
        if (userData && userData.pass === data.pass) {
            socket.userData = { ...userData, id: data.user };
            
            if (userData.role === 'dispatcher') {
                socket.join('dispatchers');
            } else {
                socket.join('vehicles');
                socket.join(`vehicle_${data.user}`);
            }

            socket.emit('login_success', { user: data.user, role: userData.role });
            console.log(`Login erfolgreich: ${data.user} (${userData.role})`);
            
            // Aktuelle Daten senden
            if (userData.role === 'dispatcher') {
                socket.emit('init_data', { vehicles: USERS, einsaetze: activeEinsaetze });
            } else {
                socket.emit('vehicle_init', { name: userData.name, status: userData.status });
            }
        } else {
            socket.emit('login_error', 'Falsche Kennung oder Passwort!');
        }
    });

    // FMS Status Update
    socket.on('update_status', (newStatus) => {
        if (socket.userData && socket.userData.role === 'vehicle') {
            const userId = socket.userData.id;
            USERS[userId].status = newStatus;
            console.log(`Status Update: ${userId} -> ${newStatus}`);
            
            // Alle Disponenten informieren
            io.to('dispatchers').emit('vehicle_status_changed', { id: userId, status: newStatus });
        }
    });

    // Alarmierung
    socket.on('send_alarm', (alarmData) => {
        if (socket.userData && socket.userData.role === 'dispatcher') {
            const einsatzId = Date.now();
            const newEinsatz = { id: einsatzId, ...alarmData, time: new Date().toLocaleTimeString() };
            activeEinsaetze.push(newEinsatz);

            console.log('Neuer Einsatz:', newEinsatz);

            // An ausgewählte Fahrzeuge senden
            alarmData.selectedVehicles.forEach(vId => {
                io.to(`vehicle_${vId}`).emit('alarm', newEinsatz);
            });

            // Alle Disponenten aktualisieren
            io.to('dispatchers').emit('new_einsatz_added', newEinsatz);
        }
    });

    socket.on('disconnect', () => {
        console.log('Getrennt:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Realistisches Leitstellen-System läuft auf http://localhost:${PORT}`);
});
