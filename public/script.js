const socket = io();

// Leitstellen-Ansicht Logik
const alarmBtn = document.getElementById('alarmBtn');

if (alarmBtn) {
    alarmBtn.addEventListener('click', () => {
        const alarmDaten = {
            fahrzeug: 'HLF 20',
            einsatzgrund: 'Feuer 1 - brennt Mülleimer'
        };

        console.log('Sende Alarm:', alarmDaten);
        socket.emit('alarm_ausloesen', alarmDaten);
    });
}

// Fahrzeug-Ansicht Logik
socket.on('neuer_alarm', (data) => {
    console.log('Alarm empfangen:', data);
    
    const statusText = document.getElementById('status');
    if (statusText) {
        statusText.innerText = `ALARM: ${data.fahrzeug} - ${data.einsatzgrund}`;
        statusText.style.color = 'red';
        statusText.style.fontWeight = 'bold';
    }

    alert(`NEUER ALARM!\nFahrzeug: ${data.fahrzeug}\nGrund: ${data.einsatzgrund}`);
});
