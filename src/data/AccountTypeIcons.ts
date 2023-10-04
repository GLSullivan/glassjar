import { AccountType } from './../utils/constants';

export const accountTypeIcons: { [K in AccountType]: string } = {
  'checking'   : 'glassjar__list-icon fa-solid fa-fw fa-money-check-dollar-pen',
  'savings'    : 'glassjar__list-icon fa-solid fa-fw fa-piggy-bank',
  'credit card': 'glassjar__list-icon fa-solid fa-fw fa-credit-card',
  'loan'       : 'glassjar__list-icon fa-solid fa-fw fa-hand-holding-dollar',
  'mortgage'   : 'glassjar__list-icon fa-solid fa-fw fa-house-chimney-window',
  'cash'       : 'glassjar__list-icon fa-solid fa-fw fa-wallet',
};
