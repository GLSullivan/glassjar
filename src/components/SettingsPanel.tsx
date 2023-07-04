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
import { setSignedIn } from "../redux/slices/auth";

const SettingsPanel: React.FC = () => {
  const dispatch = useDispatch();

  const { healthRangeTop, healthRangeBottom } = useSelector(
    (state: RootState) => state.userPrefs
  );
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);

const signOut = () => {
  dispatch(setSignedIn(false))
  firebase.auth().signOut()
}

  return (
    <div className="glassjar__settings-panel">
      <div>
        <h2>Dev Tools Menu</h2>
        <p>Welcome, {currentUser?.displayName}</p>
      </div>
      <div>
        <button onClick={() => dispatch(openTransactionHelper())}>
          Run Transaction Helper
        </button>
      </div>
      <label>
        Health Range Top:
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
      </label>
      <label>
        Health Range Bottom:
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
      </label>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
};

export default SettingsPanel;
