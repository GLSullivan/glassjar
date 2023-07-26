import { Formik, Field, Form, ErrorMessage }  from 'formik';
import * as Yup                               from 'yup';
import firebase                               from 'firebase/compat/app';
import 'firebase/compat/auth';

import { useDispatch }                        from 'react-redux';
import React, { useEffect, useState }         from 'react';

import { setCurrentUser, setSignedIn }        from './../redux/slices/auth';

import landing                                from './../media/images/landing_hero.webp';
import logo                                   from './../media/images/glassjar_logo1.svg';
import copyright                              from './../media/images/copyright.svg';
import fourJars                               from './../media/images/fours-jars.jpg';


import './../css/Landing.css';

function Landing() {
  const dispatch = useDispatch();
  const [firebaseSignInError, setFirebaseSignInError] = useState<string | null>( null );
  const [firebaseSignUpError, setFirebaseSignUPError] = useState<string | null>( null );

  
  const [showPassword, setShowPassword]         = useState(false);
  const [mode, setMode]                         = useState('signIn');
  const [emailHasBeenSent, setEmailHasBeenSent] = useState<boolean>(false);
  const [error, setError]                       = useState<string>('');

  const sendResetEmail = async (values: { email: string }) => {
    try {
      await firebase.auth().sendPasswordResetEmail(values.email);
      setEmailHasBeenSent(true);
      setTimeout(() => {
        setEmailHasBeenSent(false);
      }, 3000);
    } catch (error) {
      setError('Error resetting password');
    }
  };
  
  const forgotPasswordValidationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email format').required('Required'),
  });

  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email format').required('Required'),
    password: Yup.string()
      .min(6, 'Must be > 6 characters')
      .required('Required'),
  });

  const signIn = async (
    values: { email: string; password: string },
    { setSubmitting }: any
  ) => {
    try {
      await firebase
        .auth()
        .signInWithEmailAndPassword(values.email, values.password);
    } catch (error: any) {
      const friendlyErrors: { [key: string]: string } = {
        'auth/user-not-found': 'No user with this email found.',
        'auth/wrong-password': 'Wrong password.',
      };

      setFirebaseSignInError(
        friendlyErrors[error.code] || 'An error occurred.'
      );
    }
    setSubmitting(false);
  };

  const signInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await firebase.auth().signInWithPopup(provider);
    } catch (error: any) {
      // An error happened.
      const friendlyErrors: { [key: string]: string } = {
        'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials.',
        'auth/popup-closed-by-user'                    : 'The popup has been closed before authentication could complete.',
      };

      setFirebaseSignUPError(
        friendlyErrors[error.code] || 'An error occurred.'
      );
    }
  };

  const signUp = async (values: { email: string; password: string }) => {
    try {
      await firebase
        .auth()
        .createUserWithEmailAndPassword(values.email, values.password);
    } catch (error: any) {
      const friendlyErrors: { [key: string]: string } = {
        'auth/email-already-in-use': 'The email address is already in use by another account.',
        'auth/weak-password'       : 'The password is too weak.',
      };

      setFirebaseSignUPError(
        friendlyErrors[error.code] || 'An error occurred.'
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
              uid        : user.uid,
              displayName: user.displayName,
              email      : user.email,
              photoURL   : user.photoURL,
            })
          );
        } else {
          dispatch(setCurrentUser(null));
        }
      });

    return () => unregisterAuthObserver();
  }, [dispatch]);

  const [showMore, setShowMore] = useState<boolean>(false);

  return (
    <>
      <div className='glassjar__landing'>
        <div>
          <button className="glassjar__more-tab" onClick={() => setShowMore(!showMore)}>
            <i className={`fa-solid fa-fw fa-circle-x glassjar__more-tab__icon ${showMore ? 'open' : ''}`} />
            <i className={`fa-solid fa-fw fa-circle-info glassjar__more-tab__icon ${showMore ? '' : 'open'}`} />
          </button>
          <div className={`glassjar__welcome-content ${showMore ? 'open' : ''}`}>
            <img
              className='glassjar__landing__img glassjar__landing__img--jars'
              src={fourJars}
              alt=''
            />
            <section>
              <h1>Visualize Your Financial Journey</h1>
              <p><strong>Glass Jar</strong> serves as a financial calendar, simplifying the process of managing your finances. With its intuitive interface inspired by the calendar apps you're familiar with, learning to navigate it is a breeze.</p>
              <p>With just a few minutes of setup, our robust assistant tool enables you to forecast your financial future up to five years ahead. Begin making informed financial plans with confidence, having a clear vision of their potential impact.</p>
              <p><strong>Glass Jar</strong> is the creation of <span className='glassjar__no-wrap'>Greg Sullivan</span> and is currently available free of charge during its development phase. As it is still evolving, you may encounter some unfinished features or minor bugs. Rest assured, I'm continuously refining the app to ensure a seamless experience. Your patience and support are greatly appreciated.</p>  
              <p>If you find a bug or have an idea for a feature, I would be very happy to hear about it. Reach me at <a href='mailto:greg@artofsullivan.com?subject=Glass Jar&body=Hi Greg...'>greg@artofsullivan.com</a></p>
            </section>
          </div>
          <div className='glassjar__landing__form'>
            <h1>Welcome</h1>
            <div>
              <div
                className={`glassjar__auto-height glassjar__auto-height--top ${
                  mode === 'signIn' ? 'open' : ''
                }`}
              >
                <div>
                  <Formik
                    initialValues={{ email: '', password: '' } as any}
                    validationSchema={validationSchema}
                    onSubmit={signIn}
                  >
                    {({ errors }) => (
                      <Form>
                        <div className='glassjar__flex glassjar__flex--column glassjar__flex--tight'>
                          <div className='glassjar__form__input-group'>
                            <Field
                              name        = 'email'
                              type        = 'email'
                              placeholder = 'Email'
                              autoComplete= 'username'
                              className   = {errors.email ? 'error' : ''}
                            />
                            <label htmlFor='email'>
                              Email{' '}
                              <span className='glassjar__form__input-group__error'>
                                <ErrorMessage name='email' />
                              </span>
                            </label>
                          </div>
                          <div className='glassjar__form__input-group'>
                            <button
                              className = 'glassjar__password-toggle'
                              type      = 'button'
                              onClick   = {() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <i className='fa-solid fa-fw fa-eye-slash' /> : <i className='fa-solid fa-fw fa-eye' />}
                            </button>
                            <Field
                              name         = 'password'
                              type         = {showPassword ? 'text' : 'password'}
                              placeholder  = 'Password'
                              autoComplete = 'current-password'
                              className    = {errors.password ? 'error' : ''}
                            />
                            <label htmlFor='password'>
                              Password{' '}
                              <span className='glassjar__form__input-group__error'>
                                <ErrorMessage name='password' />
                              </span>
                            </label>
                          </div>
                          <div>
                            <div
                              className={`glassjar__auto-height glassjar__auto-height--top ${
                                firebaseSignInError ? 'open' : ''
                              }`}
                            >
                              <div className='glassjar__error-block'>
                                <p>{firebaseSignInError}</p>
                              </div>
                            </div>
                            <div className='glassjar__flex'>
                              <button
                                type='button'
                                className='glassjar__button glassjar__button--primary'
                                onClick={signInWithGoogle}
                              >
                                <i className='fa-brands fa-google' />
                              </button>
                              <button
                                className='glassjar__button glassjar__button--primary'
                                type='submit'
                              >
                                Sign In
                              </button>
                            </div>
                          </div>
                          <p>
                            Don't have an account?{' '}
                            <span
                              onClick={() => setMode('signUp')}
                              className='glassjar__text-link'
                            >
                              Sign UP
                            </span>
                          </p>
                          <p>
                            <span
                              onClick={() => setMode('forgot')}
                              className='glassjar__text-link'
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
                className={`glassjar__auto-height glassjar__auto-height--top ${
                  mode === 'signUp' ? 'open' : ''
                }`}
              >
                <div>
                  <Formik
                    initialValues={{ email: '', password: '' } as any}
                    validationSchema={validationSchema}
                    onSubmit={signUp}
                  >
                    {({ errors }) => (
                      <Form>
                        <div className='glassjar__flex glassjar__flex--column glassjar__flex--tight'>
                          <div className='glassjar__form__input-group'>
                            <Field
                              name        = 'email'
                              type        = 'email'
                              placeholder = 'Email'
                              autoComplete= 'username'
                              className   = {errors.email ? 'error' : ''}
                            />
                            <label htmlFor='email'>
                              Email{' '}
                              <span className='glassjar__form__input-group__error'>
                                <ErrorMessage name='email' />
                              </span>
                            </label>
                          </div>
                          <div className='glassjar__form__input-group'>
                            <button
                              className = 'glassjar__password-toggle'
                              type      = 'button'
                              onClick   = {() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <i className='fa-solid fa-fw fa-eye-slash' /> : <i className='fa-solid fa-fw fa-eye' />}
                            </button>
                            <Field
                              name         = 'password'
                              type         = {showPassword ? 'text' : 'password'}
                              placeholder  = 'Password'
                              className    = {errors.password ? 'error' : ''}
                              autoComplete = 'new-password'
                            />
                            <label htmlFor='password'>
                              Password{' '}
                              <span className='glassjar__form__input-group__error'>
                                <ErrorMessage name='password' />
                              </span>
                            </label>
                          </div>
                          <div>
                            <div
                              className={`glassjar__auto-height glassjar__auto-height--top ${
                                firebaseSignUpError ? 'open' : ''
                              }`}
                            >
                              <div className='glassjar__error-block'>
                                <p>{firebaseSignUpError}</p>
                              </div>
                            </div>
                            <div className='glassjar__flex'>
                              <button
                                className='glassjar__button glassjar__button--primary'
                                type='submit'
                              >
                                Sign Up
                              </button>
                            </div>
                          </div>
                          <p>
                            Already have an account?{' '}
                            <span
                              onClick={() => setMode('signIn')}
                              className='glassjar__text-link'
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
                className={`glassjar__auto-height glassjar__auto-height--top ${
                  mode === 'forgot' ? 'open' : ''
                }`}
              >
                <div>
                  <Formik
                    initialValues={{ email: '' } as any}
                    validationSchema={forgotPasswordValidationSchema}
                    onSubmit={sendResetEmail}
                  >
                    {({ errors, isSubmitting }) => (
                      <Form>
                        <div className='glassjar__flex glassjar__flex--column glassjar__flex--tight'>
                          <p>Reset your Password</p>
                          <div
                            className={`glassjar__auto-height glassjar__auto-height--top ${
                              emailHasBeenSent ? 'open' : ''
                            }`}
                          >
                            <div>
                              <p>
                                An email has been sent to you! <br />
                                You might need to check your spam folder.
                              </p>
                            </div>
                          </div>
                          {error !== '' && <div>{error}</div>}
                          <div className='glassjar__form__input-group'>
                            <Field
                              type        = 'email'
                              name        = 'email'
                              id          = 'email'
                              placeholder = 'Your Email'
                              className   = {errors.email ? 'error' : ''}
                            />
                            <label htmlFor='email'>
                              Email:{' '}
                              <span className='glassjar__form__input-group__error'>
                                <ErrorMessage name='email' />
                              </span>
                            </label>
                          </div>
                          <button
                            className='glassjar__button glassjar__button--primary'
                            type='submit'
                            disabled={isSubmitting}
                          >
                            Send Reset Link
                          </button>
                          <p>
                            <span
                              onClick={() => setMode('signIn')}
                              className='glassjar__text-link'
                            >
                              Back To Sign In
                            </span>
                          </p>{' '}
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>
            </div>
          </div>
          <img
            className='glassjar__landing__img glassjar__landing__img--hero'
            src={landing}
            alt=''
          />
        </div>
        <img
          className='glassjar__landing__img glassjar__landing__img--logo'
          src={logo}
          alt=''
        />
        <img
          className='glassjar__landing__img glassjar__landing__img--copyright'
          src={copyright}
          alt=''
        />
      </div>
    </>
  );
}

export default Landing;
