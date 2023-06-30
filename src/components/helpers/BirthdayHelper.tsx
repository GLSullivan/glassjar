import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import BirthdayTransactionForm from "../forms/BirthdayTransactionForm";
import { Transaction } from './../../models/Transaction';
import { RootState } from "./../../redux/store";

interface Form {
  key                     ?: number;
  initialCategory         ?: string;
  initialName             ?: string;
  initialArbitraryDates   ?: string[] | undefined;
  isActive                ?: boolean;
  initialActiveTransaction?: Transaction | null;
}

const BirthdayHelper: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);

  const [initialForm, setInitialForm] = useState<Form>({
      key                     : Date.now(),
      initialCategory         : "Charity and Gifts",
      initialName             : "",
      isActive                : false,
      initialActiveTransaction: null
  });

  const allTransactions = useSelector(
    (state: RootState) => state.transactions.transactions
  );

  useEffect(() => {
    const newTransactions = allTransactions.filter(
      (transaction) => transaction.fromHelper === "birthday"
    );
  
    const newForms = newTransactions.map((transaction, index) => ({
      key                     : Number(transaction.id + '' + index), 
      initialCategory         : transaction.category,
      initialName             : transaction.transactionName,
      initialArbitraryDates   : transaction.arbitraryDates,
      isActive                : true,
      initialActiveTransaction: transaction
    }));
  
    setForms(newForms);
  }, [allTransactions]);
  
  
  const handleFormSubmit = (formData: Transaction) => {
    setForms((prevForms) => [
      ...prevForms,
      {
        key: Date.now(),
        ...formData,
        isActive: true,
      },
    ]);
  
    // Resets the initialForm state
    setInitialForm({
      key: Date.now(),
      initialCategory: "Charity and Gifts",
      isActive: false,
    });
  };
  
  return (
    <>
      <BirthdayTransactionForm
        key                      = {initialForm.key}
        initialCategory          = {initialForm.initialCategory}
        isActive                 = {initialForm.isActive}
        initialActiveTransaction = {initialForm.initialActiveTransaction}
        initialFromHelper        = "birthday"
        onSubmit                 = {handleFormSubmit}
      />
      {forms.map((form, index) => (
        <BirthdayTransactionForm
          key                      = {form.key || index} // Using index as a fallback
          initialCategory          = {form.initialCategory}
          isActive                 = {form.isActive}
          initialActiveTransaction = {form.initialActiveTransaction}
          initialFromHelper        = "birthday"
        />
      ))}
    </>
  );
};

export default BirthdayHelper;
