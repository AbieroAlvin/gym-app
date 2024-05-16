import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { setDoc, doc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState({});
  const [profileImageURL, setProfileImageURL] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        setProfileImageURL(user.photoURL || "");
      } else {
        setUser(null);
        setProfileImageURL("");
      }
    });

    return unsubscribe;
  }, []);

  const logIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logOut = () => {
    return signOut(auth);
  };

  const signUp = (email, password) => {
    createUserWithEmailAndPassword(auth, email, password);
    setDoc(doc(db, "users", email), {
      likedShows: [],
    });
  };

  const updateProfileData = async (name, password, profileImageURL) => {
    //   const auth = getAuth();
    //   const user = auth.currentUser;

    if (user) {
      try {
        const updates = {};
        if (name) updates.displayName = name;

        if (profileImageURL) {
          const storage = getStorage();
          const imageRef = ref(storage, `profile-images/${user.uid}`);
          await uploadBytes(imageRef, profileImageURL);
          const downloadURL = await getDownloadURL(imageRef);
          updates.photoURL = downloadURL;
          setProfileImageURL(downloadURL); // Assuming this is a state update function
        } else if (!profileImageURL) {
          updates.photoURL = user.photoURL;
        }

        await updateProfile(user, updates);

        if (password) {
          await updatePassword(user, password);
        }
      } catch (error) {
        throw new Error(`Error updating profile: ${error.message}`);
      }
    }
  };
};
