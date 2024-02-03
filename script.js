import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js';
import {addDoc, collection, getDocs, query } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';

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

export async function joinLobby() {
    const username = document.getElementById("entrer-nom").value;
    if (username.trim() !== "") {
        const query1 = query(usersCollection);
        const snapshot = await getDocs(query1);
        const isHost = snapshot.empty;

        const docRef = await addDoc(usersCollection, {
            name: username,
            image: "utilisateur.png", // à changer
            gameID: 0,
            score: 0,
            mot: "",
            mot1: "",
            mot2: "",
            mot3: "",
            ready: false,
            host: isHost,
            imposteur: false,
            tour: false
        });
        await localStorage.setItem('userId', docRef.id);
        window.location.href = "lobby.html";
    } else {
        alert("Entrez un nom correct.");
    }
}
