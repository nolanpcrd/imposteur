import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    onSnapshot,
    query,
    setDoc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDW4SEoc3RjXNWcYbZQf3wrd9VRslsxwaQ",
    authDomain: "imposteur-ee340.firebaseapp.com",
    projectId: "imposteur-ee340",
    storageBucket: "imposteur-ee340.appspot.com",
    messagingSenderId: "928599124186",
    appId: "1:928599124186:web:e2608e169ae1f83e4bdde3"
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getFirestore(firebaseApp);
const usersCollection = collection(database, 'users');
let unsubscribe;
let intervalId = setInterval(async () => {
    await afficherMotsUtilisateurs();
    await verifierTour();
    const allWordsPlayed = await verifierMotsJoues();
    if (allWordsPlayed) {
        clearInterval(intervalId); // Arrêter l'intervalle
        votes(); // Passer aux votes
    }
}, 1000);

export async function leave() {
    const userDoc = doc(database, 'users', localStorage.getItem('userId'));
    await deleteDoc(userDoc);
    window.location.href = "index.html";
}

export function listenToUsers() {
    const query1 = query(usersCollection);

    if (unsubscribe) {
        unsubscribe();
    }
    unsubscribe = onSnapshot(query1, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const user = { id: change.doc.id, ...change.doc.data() };
                let name = user.name;
                let image = user.image;
                let id = user.gameID;
                addUser(image, name, id);
            }
        });
    });
}

export async function deleteAllUsers() {
    if (unsubscribe) {
        unsubscribe();
    }

    const query1 = query(usersCollection);
    const snapshot = await getDocs(query1);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    location.href = "index.html";
}

function addUser(image, name, id) {
    let user = document.createElement('div');
    user.className = 'user';
    user.id = 'user' + id;
    user.innerHTML = `<img src="${image}" alt="${image}"><h2>${name}</h2><h4>Score : 0</h4>`;
    document.querySelector('.users-container').appendChild(user);

    for (let i = 1; i <= 3; i++) {
        let mot = document.createElement('h3');
        mot.className = 'mot'; // Ajouter une classe 'mot' à l'élément 'h3'
        mot.textContent = '';
        user.appendChild(mot);
    }
}

function showScores() {
    const query1 = query(usersCollection);
    unsubscribe = onSnapshot(query1, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified') {
                const user = { id: change.doc.id, ...change.doc.data() };
                let id = user.gameID;
                let score = user.score;
                document.querySelector('#user' + id + ' h4').textContent = 'Score : ' + score;
            }
        });
    });
}

export async function initGame() {
    const userId = localStorage.getItem('userId');
    const userDoc = doc(database, 'users', userId);
    const userSnapshot = await getDoc(userDoc);
    const userData = userSnapshot.data();

    if (userData.host) {
        const query1 = query(usersCollection);
        const snapshot = await getDocs(query1);
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        for (let i = 0; i < users.length; i++) {
            users[i].gameID = i + 1;
            users[i].imposteur = false;
            users[i].tour = false;
        }

        const randomImposteur = Math.floor(Math.random() * users.length);
        const randomTour = Math.floor(Math.random() * users.length);

        users[randomImposteur].imposteur = true;
        users[randomTour].tour = true;

        for (const user of users) {
            const userDoc = doc(database, 'users', user.id);
            await setDoc(userDoc, user);
        }
    }
    await distribuerMots('chien', 'chat');
    showScores();
    await afficherMots();
}

async function afficherMots() {
    const userId = localStorage.getItem('userId');
    const userDoc = doc(database, 'users', userId);
    const userSnapshot = await getDoc(userDoc);
    const userData = userSnapshot.data();

    document.querySelector('#mot').textContent = userData.mot;
}

async function distribuerMots(mot, motimposteur) {
    const userId = localStorage.getItem('userId');
    const userDoc = doc(database, 'users', userId);
    const userSnapshot = await getDoc(userDoc);
    const userData = userSnapshot.data();

    if (userData.imposteur) {
        await updateDoc(userDoc, {
            mot: motimposteur
        });
    }
    else {
        await updateDoc(userDoc, {
            mot: mot
        });
    }
}

async function verifierTour () {
    const userId = localStorage.getItem('userId');
    const userDoc = doc(database, 'users', userId);
    const userSnapshot = await getDoc(userDoc);
    const userData = userSnapshot.data();

    // Afficher le mot de l'utilisateur actuel
    document.querySelector('#mot').textContent = userData.mot;

    if (userData.tour) {
        let popup = document.querySelector('#pop-up');
        popup.style.display = 'block';
        let timer = 30;
        popup.querySelector('h2').textContent = 'temps restant: ' + timer;
        let interval = setInterval(() => {
            timer--;
            popup.querySelector('h2').textContent = 'temps restant: ' + timer;
            if (timer === 0) {
                clearInterval(interval);
                popup.style.display = 'none';
                passerTour();
            }
        }, 1000);

        const sendButton = document.querySelector('#envoyer');
        sendButton.addEventListener('click', async () => {
            const enteredText = document.querySelector('#texte').value;

            await updateDoc(userDoc, { enteredText: enteredText });

            clearInterval(interval);
            popup.style.display = 'none';
            if (verifierMotsJoues()) {
                await votes();
            }
            else {
                await passerTour();
            }
        });
    }
}

async function afficherMotsUtilisateurs() {
    const query1 = query(usersCollection);
    const snapshot = await getDocs(query1);
    snapshot.forEach((doc) => {
        const user = doc.data();
        let id = user.gameID;
        let motsElements = document.querySelectorAll('#user' + id + ' .mot'); // Sélectionner les éléments 'h3' avec la classe 'mot'
        for (let i = 1; i <= 3; i++) {
            let mot = user['mot' + i];
            if (motsElements[i - 1]) {
                motsElements[i - 1].textContent = mot;
            }
        }
    });
}

function listenToTurnChanges() {
    const query1 = query(usersCollection);
    unsubscribe = onSnapshot(query1, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'modified' && change.oldDoc) {
                const user = { id: change.doc.id, ...change.doc.data() };
                const oldUser = change.oldDoc.exists ? { id: change.doc.id, ...change.oldDoc.data() } : null;
                if (oldUser && user.tour !== oldUser.tour) {
                    await verifierTour();
                }
            }
        });
    });
}

async function passerTour() {
    const userId = localStorage.getItem('userId');
    const userDoc = doc(database, 'users', userId);
    const userSnapshot = await getDoc(userDoc);
    const userData = userSnapshot.data();

    const query1 = query(usersCollection);
    const snapshot = await getDocs(query1);
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const currentUserIndex = users.findIndex(user => user.gameID === userData.gameID);
    const nextUserIndex = (currentUserIndex + 1) % users.length;
    const nextUser = users[nextUserIndex];

    await updateDoc(userDoc, { tour: false });
    await updateDoc(doc(database, 'users', nextUser.id), { tour: true });
}

async function verifierMotsJoues() {
    const query1 = query(usersCollection);
    const snapshot = await getDocs(query1);
    let motsJoues = true;
    snapshot.forEach((doc) => {
        const user = doc.data();
        if (user.mot1 === '' || user.mot2 === '' || user.mot3 === '') {
            motsJoues = false;
        }
    });
    return motsJoues;
}

function votes() { // désafficher tout ce qu'il y a à l'écran et afficher les votes
    document.querySelector('#mot').style.display = 'none';
    document.querySelector('#pop-up').style.display = 'none';
    document.querySelector('#texte').style.display = 'none';
    document.querySelector('#envoyer').style.display = 'none';
}
