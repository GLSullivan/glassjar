import { useDispatch, useSelector }                 from "react-redux";
import React                                        from "react";

import { setHealthRangeTop, setHealthRangeBottom }  from "../redux/slices/userprefs";
import { openTransactionHelper }                    from "./../redux/slices/modals";

import { RootState } from "../redux/store";

import "./../css/TransactionList.css";
import CurrencyInput from "react-currency-input-field";

const SettingsPanel: React.FC = () => {
  const dispatch = useDispatch();

  function clearLocalStorage() {
    localStorage.clear();
  }

  const { healthRangeTop, healthRangeBottom } = useSelector((state: RootState) => state.userPrefs);

  return (
    <>
      <h1>Dev Tools Menu</h1>
      <h3 onClick={() => clearLocalStorage()}>
        Clear Local Storage{" "}
        <i className="fa-solid fa-floppy-disk-circle-xmark" />
      </h3>
      <h3 onClick={() => dispatch(openTransactionHelper())}>
        Run Transaction Helper
      </h3>

      <label>
        Health Range Top:
        <CurrencyInput
              id="amount"
              prefix="$"
              name="amount"
              placeholder="Transaction Amount:"
              defaultValue={healthRangeTop / 100} // Convert cents to dollars for display
              decimalsLimit={2} // Allow decimal input
              onValueChange={(value) =>
                dispatch(setHealthRangeTop(value ? Math.round(parseFloat(value) * 100) : 0))
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
              defaultValue={healthRangeBottom / 100} // Convert cents to dollars for display
              decimalsLimit={2} // Allow decimal input
              onValueChange={(value) =>
                dispatch(setHealthRangeBottom(value ? Math.round(parseFloat(value) * 100) : 0))
              }
            />
      </label>

    </>
  );
};

export default SettingsPanel;
