import React, { useState }              from "react";
import { useSelector, useDispatch }     from "react-redux";
import { RootState }                    from './../../redux/store';
import { closeAccountForm }            from "./../../redux/slices/modals";
import {
    addAccount,
    updateAccount,
    setActiveAccount,
}                                       from "./../../redux/slices/accounts";
import { Account }                      from "./../../models/Account";

// import "./../css/AccountForm.css";

export const AccountForm: React.FC = () => {
  const activeAccount = useSelector(
    (state: RootState) => state.accounts.activeAccount
  );
  const [account, setAccount] = useState<Account>(
    activeAccount || {
      id: "",
      name: "",
      currentBalance: 0,
      type: "checking",
      lastUpdated: new Date().toISOString(),
    }
  );

  const dispatch = useDispatch();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (activeAccount) {
      dispatch(updateAccount(account));
    } else {
      dispatch(addAccount(account));
    }
    dispatch(setActiveAccount(null));
    dispatch(closeAccountForm());
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setAccount({ ...account, [name]: value });
  };

  return (
    <form className="glassjar__account-form" onSubmit={handleSubmit}>
      <label htmlFor="name">Name:</label>
      <input
        type="text"
        id="name"
        name="name"
        value={account.name}
        onChange={handleChange}
      />
      <label htmlFor="currentBalance">Current Balance:</label>
      <input
        type="number"
        id="currentBalance"
        name="currentBalance"
        value={account.currentBalance}
        onChange={handleChange}
      />
      <label htmlFor="type">Type:</label>
      <select
        id="type"
        name="type"
        value={account.type}
        onChange={handleChange}
      >
        <option value="checking">Checking</option>
        <option value="savings">Savings</option>
        <option value="credit card">Credit Card</option>
        <option value="loan">Loan</option>
        <option value="mortgage">Mortgage</option>
        <option value="cash">Cash</option>
      </select>
      {["loan", "mortgage", "credit card"].includes(account.type) && (
        <>
          <label htmlFor="interestRate">Interest Rate:</label>
          <input
            type="number"
            id="interestRate"
            name="interestRate"
            value={account.interestRate || ""}
            onChange={handleChange}
          />
        </>
      )}
      <button type="submit">Save</button>
    </form>
  );
};
