const firebaseConfig = {
    apiKey: "AIzaSyBDSD_qCXf6T9lfdFmWunlIiUKgltuecPM",
    authDomain: "votejam-d8294.firebaseapp.com",
    databaseURL: "https://votejam-d8294-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "votejam-d8294",
    storageBucket: "votejam-d8294.firebasestorage.app",
    messagingSenderId: "602730590680",
    appId: "1:602730590680:web:bbccb9b0296a84812ec2ad"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const ridersRef = db.ref('riders');
const configRef = db.ref('config');

ridersRef.once('value', (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById('admin-riders-list');
    
    for (let id in data) {
        const rider = data[id];
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <h3>${rider.nom}</h3>
            <input type="number" id="input-${id}" class="score-input" value="${rider.votes}">
        `;
        container.appendChild(card);
    }
});

// NOUVEAU : Fonction SET TIME (Affiche le temps sans démarrer)
function setTimer() {
    const valeurTemps = document.getElementById('time-input').value;
    
    // On indique à Firebase qu'on est en état "SET" avec le temps choisi
    configRef.update({
        timerState: "SET",
        timerDisplay: valeurTemps,
        timerEndTime: 0
    });
    
    alert("Le temps est affiché sur l'écran des votes. En attente du lancement !");
}

// Lancer le chrono
function lancerChrono() {
    const valeurTemps = document.getElementById('time-input').value;
    const parties = valeurTemps.split(':');
    
    if (parties.length !== 2 || isNaN(parties[0]) || isNaN(parties[1])) {
        alert("Format incorrect ! (exemple: 05:00)");
        return;
    }

    const minutes = parseInt(parties[0]);
    const secondes = parseInt(parties[1]);

    if (confirm(`Ouvrir les votes pour ${minutes} min et ${secondes} sec ?`)) {
        const tempsEnMillisecondes = (minutes * 60 * 1000) + (secondes * 1000);
        const heureDeFin = Date.now() + tempsEnMillisecondes;
        
        // On passe en état "RUNNING"
        configRef.update({
            timerState: "RUNNING",
            timerEndTime: heureDeFin
        });
        
        alert("BOOM ! Chrono lancé !");
    }
}

function sauvegarderScores() {
    for (let i = 1; i <= 6; i++) {
        const id = 'rider' + i;
        const nouvelleValeur = document.getElementById('input-' + id).value;
        const nouveauScore = parseInt(nouvelleValeur) || 0; 
        db.ref('riders/' + id).update({ votes: nouveauScore });
    }
    alert("BAM ! Les scores ont été modifiés.");
}

function reinitialiserClassement() {
    if (confirm("Remettre tous les scores à ZÉRO et fermer les votes ?")) {
        for (let i = 1; i <= 6; i++) {
            const id = 'rider' + i;
            db.ref('riders/' + id).update({ votes: 0 });
            document.getElementById('input-' + id).value = 0;
        }
        
        // On passe en état "CLOSED"
        configRef.update({ 
            timerState: "CLOSED", 
            timerEndTime: 0,
            timerDisplay: "00:00"
        });
        
        alert("Classement réinitialisé !");
    }
}

function debloquerMonVote() {
    localStorage.removeItem('voteEnregistre');
    alert("Mémoire locale vidée !");
}
