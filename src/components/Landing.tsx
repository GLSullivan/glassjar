import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";

import { useDispatch } from "react-redux";
import React, { useEffect, useState } from "react";

import landing from "./../media/images/landing_hero.jpg";
import logo from "./../media/images/glassjar_logo1.svg";
import copyright from "./../media/images/copyright.svg";

import "./../css/Landing.css";

import firebase from "firebase/compat/app";
import "firebase/compat/auth";

import { setCurrentUser, setSignedIn } from "./../redux/slices/auth";

function Landing() {
  const dispatch = useDispatch();
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email format").required("Required"),
    password: Yup.string()
      .min(6, "Must be > 6 characters")
      .required("Required"),
  });

  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");

  const signIn = async (
    values: { email: string; password: string },
    { setSubmitting }: any
  ) => {
    try {
      await firebase
        .auth()
        .signInWithEmailAndPassword(values.email, values.password);
      // User signed in successfully.
      // Redirect to homepage or show a success message.
    } catch (error: any) {
      // An error happened.
      const friendlyErrors: { [key: string]: string } = {
        "auth/user-not-found": "No user with this email found.",
        "auth/wrong-password": "Wrong password.",
        // add other error codes and messages that you want to handle
      };

      setFirebaseError(friendlyErrors[error.code] || "An error occurred.");
    }
    setSubmitting(false);
  };

  const signInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await firebase.auth().signInWithPopup(provider);
      // User signed in with Google successfully.
      // Redirect to homepage or show a success message.
    } catch (error: any) {
      // An error happened.
      const friendlyErrors: { [key: string]: string } = {
        "auth/account-exists-with-different-credential":
          "An account already exists with the same email address but different sign-in credentials.",
        "auth/popup-closed-by-user":
          "The popup has been closed before authentication could complete.",
        // add other error codes and messages that you want to handle
      };

      setFirebaseError(friendlyErrors[error.code] || "An error occurred.");
    }
  };

  // const signUp = async (event: React.FormEvent) => {
  //   event.preventDefault();
  //   try {
  //     await firebase.auth().createUserWithEmailAndPassword(email, password);
  //     // User signed up successfully.
  //     // Redirect to homepage or show a success message.
  //   } catch (error: any) {
  //     // An error happened.
  //     const friendlyErrors: { [key: string]: string } = {
  //       "auth/email-already-in-use":
  //         "The email address is already in use by another account.",
  //       "auth/weak-password": "The password is too weak.",
  //       // add other error codes and messages that you want to handle
  //     };

  //     setFirebaseError(friendlyErrors[error.code] || "An error occurred.");
  //   }
  // };

  useEffect(() => {
    const unregisterAuthObserver = firebase
      .auth()
      .onAuthStateChanged((user) => {
        dispatch(setSignedIn(!!user));
        if (user) {
          dispatch(
            setCurrentUser({
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
            })
          );
        } else {
          dispatch(setCurrentUser(null));
        }
      });

    return () => unregisterAuthObserver();
  }, [dispatch]);

  return (
    <>
      <div className="glassjar__landing">
        <div>
          <Formik
            initialValues={{ email: "", password: "" } as any}
            validationSchema={validationSchema}
            onSubmit={signIn}
          >
            {({ errors }) => (
              <Form className="glassjar__landing__form">
                <h1>Welcome</h1>
                <div>
                  <div className="glassjar__form__input-group">
                    <Field name="email" type="email" placeholder="Email" className={errors.email ? "error" : ""} />
                    <label htmlFor="email">Email{" "}
                      <span className="glassjar__form__input-group__error">
                        <ErrorMessage name="email" />
                      </span>
                    </label>
                  </div>
                  <div className="glassjar__form__input-group">
                    <Field
                      name="password"
                      type="password"
                      placeholder="Password"
                      className={errors.password ? "error" : ""} 
                    />
                    <label htmlFor="password">Password{" "}
                      <span className="glassjar__form__input-group__error">
                        <ErrorMessage name="password" />
                      </span>
                    </label>
                  </div>
                  {firebaseError && <div>{firebaseError}</div>}
                  <div className="glassjar__flex">
                    <button className="glassjar__button glassjar__button--primary" onClick={signInWithGoogle}>
                      <i className="fa-brands fa-google" />
                    </button>
                    <button className="glassjar__button glassjar__button--primary" type="submit">Sign In</button>
                  </div>
                  <p>
                    Don't have an account?{" "}
                    <span className="glassjar__text-link">
                    {/* <span onClick={signUp} className="glassjar__text-link"> */}
                      Sign up
                    </span>
                  </p>
                  <p>
                    <span className="glassjar__text-link">
                      Forgot Your Password?
                    </span>
                  </p>
                </div>
              </Form>
            )}
          </Formik>
          <img
            className="glassjar__landing__img glassjar__landing__img--hero"
            src={landing}
            alt=""
          />
        </div>
        <img
          className="glassjar__landing__img glassjar__landing__img--logo"
          src={logo}
          alt=""
        />
        <img
          className="glassjar__landing__img glassjar__landing__img--copyright"
          src={copyright}
          alt=""
        />
      </div>
    </>
  );
}

export default Landing;
