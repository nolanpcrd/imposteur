import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import {doc, deleteDoc, collection, query, onSnapshot, getFirestore, updateDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';

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
                addUser(image, name);
            }
        });
    });
}

export async function ready() {
    const userDoc = doc(database, 'users', localStorage.getItem('userId'));
    await updateDoc(userDoc, {
        ready: true
    });
}

export function verifyEverybodyReady() {
    const query1 = query(usersCollection);
    unsubscribe = onSnapshot(query1, (snapshot) => {
        let everybodyReady = true;
        let nbUsers = 0;
        snapshot.forEach((doc) => {
            nbUsers++;
            const user = doc.data();
            if (!user.ready) {
                everybodyReady = false;
            }
        });
        if (everybodyReady && nbUsers >= 3) {
            window.location.href = "jeu.html";
        }
    });
    setReadyNamesToGreen();
}

export async function deleteAllUsers() {
    if (unsubscribe) {
        unsubscribe();
    }
    const query1 = query(usersCollection);
    const snapshot = await getDocs(query1);
    for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
    }
}

function addUser(image, name) {
    let user = document.createElement('div');
    user.className = 'user';
    user.innerHTML = `<img src="${image}" alt="${image}"><h2>${name}</h2>`;
    document.querySelector('.users-container').appendChild(user);
}

function setReadyNamesToGreen() {
    const query1 = query(usersCollection);
    unsubscribe = onSnapshot(query1, (snapshot) => {
        snapshot.forEach((doc) => {
            const user = doc.data();
            if (user.ready) {
                const userElements = Array.from(document.querySelectorAll('h2')).filter(h2 => h2.textContent === user.name);
                userElements.forEach(userElement => userElement.style.color = "green");
            }
        });
    });
}