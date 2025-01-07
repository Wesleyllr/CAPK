import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  browserLocalPersistence,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Importa o Firestore
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native"; // Importa Platform
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCsOvBG67DfpdhNzy72bo_dG91DnSQjYfE",
  authDomain: "pjfirebase-30a91.firebaseapp.com",
  projectId: "pjfirebase-30a91",
  storageBucket: "pjfirebase-30a91.firebasestorage.app",
  messagingSenderId: "272073001168",
  appId: "1:272073001168:web:4d2e1a3b76a64f7e2176d5",
  measurementId: "G-TFVKQ9EVCD",
};

const app = initializeApp(firebaseConfig);

const storage = getStorage(app);

// Verifica se o ambiente é Web ou React Native
const isWeb = Platform.OS === "web";

// Configura a persistência de acordo com o ambiente
const auth = initializeAuth(app, {
  persistence: isWeb
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage),
});

// Inicializa o Firestore
const db = getFirestore(app);

export { auth, db, storage }; // Exporta tanto o Auth quanto o Firestore
