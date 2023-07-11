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
  const [firebaseSignInError, setFirebaseSignInError] = useState<string | null>( null );
  const [firebaseSignUpError, setFirebaseSignUPError] = useState<string | null>( null );

  const [mode, setMode] = useState("signIn");
  const [email, setEmail] = useState<string>('');
  const [emailHasBeenSent, setEmailHasBeenSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;

    if (name === 'userEmail') {
      setEmail(value);
    }
  };

  const sendResetEmail = async (
    values: { userEmail: string },
    { setSubmitting }: any
  ) => {  
    console.log("Reset Password?")
    try {
      await firebase
        .auth()
        .sendPasswordResetEmail(values.userEmail);
      setEmailHasBeenSent(true);
      setTimeout(() => { setEmailHasBeenSent(false) }, 3000);
    }
    catch (error) {
      setError('Error resetting password');
    }
    setSubmitting(false);
  };

  const forgotPasswordValidationSchema = Yup.object({
    userEmail: Yup.string()
      .email("Invalid email format")
      .required("Required"),
});
  
  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email format")
      .required("Required"),
    password: Yup.string()
      .min(6, "Must be > 6 characters")
      .required("Required"),
  });

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

      setFirebaseSignInError(
        friendlyErrors[error.code] || "An error occurred."
      );
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

      setFirebaseSignUPError(
        friendlyErrors[error.code] || "An error occurred."
      );
    }
  };

  const signUp = async (
    values: { email: string; password: string },
  ) => {
    try {
      await firebase
        .auth()
        .createUserWithEmailAndPassword(values.email, values.password);
      // User signed up successfully.
      // Redirect to homepage or show a success message.
    } catch (error: any) {
      // An error happened.
      const friendlyErrors: { [key: string]: string } = {
        "auth/email-already-in-use":
          "The email address is already in use by another account.",
        "auth/weak-password": "The password is too weak.",
        // add other error codes and messages that you want to handle
      };

      setFirebaseSignUPError(
        friendlyErrors[error.code] || "An error occurred."
      );
    }
  };

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
          <div className="glassjar__landing__form">
            <h1>Welcome</h1>
            <div>
              <div
                className={`glassjar__auto-height glassjar__auto-height--top ${mode === "signIn" ? "open" : ""
                  }`}
              >
                <div>
                  <Formik
                    initialValues={{ email: "", password: "" } as any}
                    validationSchema={validationSchema}
                    onSubmit={signIn}
                  >
                    {({ errors }) => (
                      <Form>
                        <div className="glassjar__flex glassjar__flex--column glassjar__flex--tight">
                          <div className="glassjar__form__input-group">
                            <Field
                              name="email"
                              type="email"
                              placeholder="Email"
                              className={errors.email ? "error" : ""}
                            />
                            <label htmlFor="email">
                              Email{" "}
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
                            <label htmlFor="password">
                              Password{" "}
                              <span className="glassjar__form__input-group__error">
                                <ErrorMessage name="password" />
                              </span>
                            </label>
                          </div>
                          <div>
                            <div
                              className={`glassjar__auto-height glassjar__auto-height--top ${firebaseSignInError ? "open" : ""
                                }`}
                            >
                              <div className="glassjar__error-block">
                                <p>{firebaseSignInError}</p>
                              </div>
                            </div>
                            <div className="glassjar__flex">
                              <button
                                className="glassjar__button glassjar__button--primary"
                                onClick={signInWithGoogle}
                              >
                                <i className="fa-brands fa-google" />
                              </button>
                              <button
                                className="glassjar__button glassjar__button--primary"
                                type="submit"
                              >
                                Sign In
                              </button>
                            </div>
                          </div>
                          <p>
                            Don't have an account?{" "}
                            <span
                              onClick={() => setMode("signUp")}
                              className="glassjar__text-link"
                            >
                              Sign UP
                            </span>
                          </p>
                          <p>
                            <span
                              onClick={() => setMode("forgot")}
                              className="glassjar__text-link"
                            >
                              Forgot Your Password?
                            </span>
                          </p>
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>

              <div
                className={`glassjar__auto-height glassjar__auto-height--top ${mode === "signUp" ? "open" : ""
                  }`}
              >
                <div>
                  <Formik
                    initialValues={{ email: "", password: "" } as any}
                    validationSchema={validationSchema}
                    onSubmit={signUp}
                  >
                    {({ errors }) => (
                      <Form>
                        <div className="glassjar__flex glassjar__flex--column glassjar__flex--tight">
                          <div className="glassjar__form__input-group">
                            <Field
                              name="email"
                              type="email"
                              placeholder="Email"
                              className={errors.email ? "error" : ""}
                            />
                            <label htmlFor="email">
                              Email{" "}
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
                            <label htmlFor="password">
                              Password{" "}
                              <span className="glassjar__form__input-group__error">
                                <ErrorMessage name="password" />
                              </span>
                            </label>
                          </div>
                          <div>
                            <div
                              className={`glassjar__auto-height glassjar__auto-height--top ${firebaseSignUpError ? "open" : ""
                                }`}
                            >
                              <div className="glassjar__error-block">
                                <p>{firebaseSignUpError}</p>
                              </div>
                            </div>
                            <div className="glassjar__flex">
                              <button
                                className="glassjar__button glassjar__button--primary"
                                type="submit"
                              >
                                Sign Up
                              </button>
                            </div>
                          </div>
                          <p>
                            Already have an account?{" "}
                            <span
                              onClick={() => setMode("signIn")}
                              className="glassjar__text-link"
                            >
                              Sign In
                            </span>
                          </p>
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>

              <div
                className={`glassjar__auto-height glassjar__auto-height--top ${mode === "forgot" ? "open" : ""
                  }`}
              >
                <div>
                  <Formik
                    initialValues={{ userEmail: "" } as any}
                    validationSchema={forgotPasswordValidationSchema}
                    onSubmit={sendResetEmail}
                  >
                    {({ errors }) => (
                      <Form>
                        <div className="glassjar__flex glassjar__flex--column glassjar__flex--tight">
                          <p>Reset your Password</p>
                          {emailHasBeenSent && (
                            <div>An email has been sent to you!</div>
                          )}
                          {error !== "" && <div>{error}</div>}
                          <div className="glassjar__form__input-group">
                            <Field
                              type="email"
                              name="userEmail"
                              id="userEmail"
                              value={email}
                              placeholder="Your Email"
                              onChange={onChangeHandler}
                              className={errors.userEmail ? "error" : ""}
                            />
                            <label htmlFor="userEmail">Email:{" "}
                              <span className="glassjar__form__input-group__error">
                                <ErrorMessage name="userEmail" />
                              </span>
                            </label>
                          </div>
                          <button
                            type="submit"
                            className="glassjar__button glassjar__button--primary"
                          // onClick={sendResetEmail}
                          >
                            Send Reset Link
                          </button>
                          <p>
                            <span
                              onClick={() => setMode("signIn")}
                              className="glassjar__text-link"
                            >
                              Back To Sign In
                            </span>
                          </p>{" "}
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>
            </div>
          </div>
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
