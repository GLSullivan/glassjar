import { useDispatch, useSelector } from "react-redux";
import React from "react";

import {
  setHealthRangeTop,
  setHealthRangeBottom,
} from "../redux/slices/userprefs";

import { openTransactionHelper } from "./../redux/slices/modals";
import { RootState } from "../redux/store";

import CurrencyInput from "react-currency-input-field";
import firebase from "firebase/compat/app";
import "./../css/SettingsPanel.css";
import { setSignedIn } from "./../redux/slices/auth";
import { setView } from './../redux/slices/views';


const SettingsPanel: React.FC = () => {
  const dispatch = useDispatch();

  const { healthRangeTop, healthRangeBottom } = useSelector(
    (state: RootState) => state.userPrefs
  );
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);

  const signOut = async () => {
    try {
      await firebase.auth().signOut();
      dispatch(setView("calendar"));
      dispatch(setSignedIn(false));
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  

  return (
    <div className="glassjar__settings-panel">
      <div>
        <h2>Dev Tools Menu</h2>
        <p>Welcome, {currentUser?.displayName}</p>
      </div>
      <div>
        <button className="glassjar__button glassjar__button--full-width glassjar__button--primary" onClick={() => dispatch(openTransactionHelper())}>
          Run Transaction Helper
        </button>
      </div>
      <div className="glassjar__form__input-group">
        <CurrencyInput
          id="amount"
          prefix="$"
          name="amount"
          placeholder="Transaction Amount:"
          defaultValue={healthRangeTop / 100}
          decimalsLimit={2}
          onValueChange={(value) =>
            dispatch(
              setHealthRangeTop(value ? Math.round(parseFloat(value) * 100) : 0)
            )
          }
        />
        <label>Health Range Top:</label>
      </div>
      <div className="glassjar__form__input-group">
        <CurrencyInput
          id="amount"
          prefix="$"
          name="amount"
          placeholder="Transaction Amount:"
          defaultValue={healthRangeBottom / 100}
          decimalsLimit={2}
          onValueChange={(value) =>
            dispatch(
              setHealthRangeBottom(
                value ? Math.round(parseFloat(value) * 100) : 0
              )
            )
          }
        />
      <label>
        Health Range Bottom:
      </label>
      </div>
      <button className="glassjar__button glassjar__button--warn" onClick={() => signOut()}>Sign Out</button>
    </div>
  );
};

export default SettingsPanel;
