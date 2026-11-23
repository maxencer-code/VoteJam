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

let votesOuverts = false;
let chronoActif;
let donneesRidersActuelles = null;

const defaultRiders = {
    "rider1": { nom: "RIDER 1", sport: "BMX Freestyle", votes: 0 },
    "rider2": { nom: "RIDER 2", sport: "Skateboard", votes: 0 },
    "rider3": { nom: "RIDER 3", sport: "Roller", votes: 0 },
    "rider4": { nom: "RIDER 4", sport: "Trottinette", votes: 0 },
    "rider5": { nom: "RIDER 5", sport: "Parkour", votes: 0 },
    "rider6": { nom: "RIDER 6", sport: "Wakeboard", votes: 0 }
};

ridersRef.once('value', (snapshot) => {
    if (!snapshot.exists()) {
        ridersRef.set(defaultRiders);
    }
});

ridersRef.on('value', (snapshot) => {
    donneesRidersActuelles = snapshot.val();
    if (donneesRidersActuelles) {
        afficherRiders(donneesRidersActuelles);
    }
});

configRef.on('value', (snapshot) => {
    const data = snapshot.val();
    const state = data ? data.timerState : "CLOSED";
    const endTime = data ? data.timerEndTime : 0;
    const displayTime = data ? data.timerDisplay : "00:00";
    
    gererMinuteur(state, endTime, displayTime);
});

function gererMinuteur(state, heureDeFin, displayTime) {
    clearInterval(chronoActif);

    const affichageTemps = document.getElementById('timer-display');
    const affichageStatut = document.getElementById('timer-status');

    if (state === "SET") {
        votesOuverts = false;
        affichageTemps.innerText = displayTime;
        affichageStatut.innerText = "EN ATTENTE";
        affichageStatut.style.color = "#FFE600";
        if (donneesRidersActuelles) afficherRiders(donneesRidersActuelles);
        return;
    }

    if (state === "CLOSED") {
        votesOuverts = false;
        affichageTemps.innerText = "00:00";
        affichageStatut.innerText = "VOTES FERMÉS";
        affichageStatut.style.color = "#FF0044";
        if (donneesRidersActuelles) afficherRiders(donneesRidersActuelles);
        return;
    }

    if (state === "RUNNING") {
        votesOuverts = true;
        affichageStatut.innerText = "VOTES OUVERTS";
        affichageStatut.style.color = "#FFE600"; 
        
        if (donneesRidersActuelles) afficherRiders(donneesRidersActuelles);

        chronoActif = setInterval(() => {
            const maintenant = Date.now();
            const tempsRestant = heureDeFin - maintenant;

            if (tempsRestant <= 0) {
                clearInterval(chronoActif);
                votesOuverts = false;
                affichageTemps.innerText = "00:00";
                affichageStatut.innerText = "VOTES FERMÉS";
                affichageStatut.style.color = "#FF0044";
                if (donneesRidersActuelles) afficherRiders(donneesRidersActuelles);
                return;
            }

            const minutes = Math.floor((tempsRestant % (1000 * 60 * 60)) / (1000 * 60));
            const secondes = Math.floor((tempsRestant % (1000 * 60)) / 1000);

            const minFormat = minutes < 10 ? "0" + minutes : minutes;
            const secFormat = secondes < 10 ? "0" + secondes : secondes;

            affichageTemps.innerText = minFormat + ":" + secFormat;
        }, 1000);
    }
}

function afficherRiders(data) {
    const container = document.getElementById('riders-container');
    container.innerHTML = ''; 

    const aDejaVote = localStorage.getItem('voteEnregistre');

    // Flèche vectorielle identique à ton visuel fleche_2.png
    const flecheSVG = `
        <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H100V100H70V51.2L21.2 100L0 78.8L48.8 30H0V0Z" fill="#000000"/>
        </svg>
    `;

    for (let id in data) {
        const rider = data[id];
        const carte = document.createElement('div');
        carte.className = 'rider-card';
        
        let boutonHTML = '';

        if (!votesOuverts) {
            boutonHTML = `<button class="vote-btn" style="background-color: #333; color: #666; border-color: #333;" disabled>FERMÉ</button>`;
        } else if (aDejaVote === 'oui') {
            boutonHTML = `<button class="vote-btn" style="background-color: #333; color: #666; border-color: #333;" disabled>A VOTÉ</button>`;
        } else {
            boutonHTML = `<button class="vote-btn" onclick="voter('${id}')">
                VOTER ${flecheSVG}
            </button>`;
        }

        const photoUrl = `${id}.jpg`;

        carte.innerHTML = `
            <img src="${photoUrl}" alt="${rider.nom}" class="rider-photo" onerror="this.src='https://ui-avatars.com/api/?name=X&background=000&color=FFF';">
            <div class="rider-info">
                <h3>${rider.nom}</h3>
            </div>
            ${boutonHTML}
        `;
        container.appendChild(carte);
    }
}

function voter(id) {
    if (!votesOuverts) {
        alert("⏱️ Trop tard, les votes sont fermés !");
        return;
    }
    
    if (localStorage.getItem('voteEnregistre') === 'oui') {
        alert("⚠️ Tu as déjà voté !");
        return;
    }

    const voteRef = db.ref('riders/' + id + '/votes');
    voteRef.transaction((votesActuels) => {
        return (votesActuels || 0) + 1;
    }, (error, committed) => {
        if (committed) {
            localStorage.setItem('voteEnregistre', 'oui');
            alert("🔥 Ton vote a bien été enregistré !");
            if (donneesRidersActuelles) afficherRiders(donneesRidersActuelles);
        } else {
            alert("Erreur de connexion avec le serveur.");
        }
    });
}
