import firebase from "firebase/app";
import "firebase/database";

const config = {
	apiKey: "AIzaSyC1wuDVw3r3hira1fEK3nYCbX6nu66bfqg",
	authDomain: "thething-98c2d.firebaseapp.com",
	projectId: "thething-98c2d",
	storageBucket: "thething-98c2d.appspot.com",
	messagingSenderId: "835718742144",
	appId: "1:835718742144:web:9809226ab6c8ba3cdee665"
}

const db = firebase.initializeApp(config);
export default db;