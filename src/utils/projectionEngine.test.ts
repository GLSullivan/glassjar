import {
  MAX_PROJECTION_DAYS,
  calculateInterestCents,
  expandFloatingOccurrences,
  expandTransactionOccurrences,
  findUnrecordedPending,
  isInterestDue,
  runProjection,
} from './projectionEngine';
import { makeAccount, makeRecurring, makeTransaction } from './testFixtures';
import { AccountType, RecurrenceFrequency, TransactionType } from './constants';

describe('expandTransactionOccurrences (transaction window)', () => {
  test('daily recurrence includes BOTH window endpoints (today is in the projection)', () => {
    const transaction = makeRecurring(RecurrenceFrequency.DAILY, { start_date: '2025-12-01' });
    const keys = expandTransactionOccurrences(transaction, '2026-01-15', '2026-01-20').sort();
    expect(keys).toEqual([
      '2026-01-15', '2026-01-16', '2026-01-17',
      '2026-01-18', '2026-01-19', '2026-01-20',
    ]);
  });

  test('one-time transaction dated on the window start (today) is included', () => {
    const transaction = makeTransaction({ start_date: '2026-01-15' });
    expect(expandTransactionOccurrences(transaction, '2026-01-15', '2026-02-15')).toEqual(['2026-01-15']);
  });

  test('one-time transaction dated on the window end is included', () => {
    const transaction = makeTransaction({ start_date: '2026-02-15' });
    expect(expandTransactionOccurrences(transaction, '2026-01-15', '2026-02-15')).toEqual(['2026-02-15']);
  });

  test('one-time transaction before the window is excluded', () => {
    const transaction = makeTransaction({ start_date: '2026-01-14' });
    expect(expandTransactionOccurrences(transaction, '2026-01-15', '2026-02-15')).toEqual([]);
  });

  test('exdates remove occurrences', () => {
    const transaction = makeRecurring(RecurrenceFrequency.DAILY, {
      start_date: '2026-01-15',
      exdates   : ['2026-01-17'],
    });
    const keys = expandTransactionOccurrences(transaction, '2026-01-15', '2026-01-19').sort();
    expect(keys).toEqual(['2026-01-15', '2026-01-16', '2026-01-18', '2026-01-19']);
  });

  test('null, empty, and garbage rrule values fall back to one-time instead of crashing', () => {
    for (const rrule of [null as any, '', 'not json {', '{"unexpected":true}']) {
      const transaction = { ...makeTransaction({ start_date: '2026-01-20' }), rrule };
      expect(expandTransactionOccurrences(transaction, '2026-01-15', '2026-02-15')).toEqual(['2026-01-20']);
    }
  });

  test('monthly recurrence lands on the same calendar day across DST changes', () => {
    const transaction = makeRecurring(RecurrenceFrequency.MONTHLY, { start_date: '2026-01-09' });
    const keys = expandTransactionOccurrences(transaction, '2026-01-01', '2026-12-31').sort();
    expect(keys).toEqual([
      '2026-01-09', '2026-02-09', '2026-03-09', '2026-04-09',
      '2026-05-09', '2026-06-09', '2026-07-09', '2026-08-09',
      '2026-09-09', '2026-10-09', '2026-11-09', '2026-12-09',
    ]);
  });
});

describe('interest', () => {
  test('daily-compounding types accrue daily; mortgages only on the due day', () => {
    const savings  = makeAccount({ type: AccountType.SAVINGS, interestRate: 4 });
    const mortgage = makeAccount({ type: AccountType.MORTGAGE, interestRate: 6, dueDate: '2026-01-15' });
    const checking = makeAccount({ type: AccountType.CHECKING, interestRate: 4 });

    expect(isInterestDue(savings, '2026-01-14')).toBe(true);
    expect(isInterestDue(mortgage, '2026-01-14')).toBe(false);
    expect(isInterestDue(mortgage, '2026-01-15')).toBe(true);
    expect(isInterestDue(checking, '2026-01-15')).toBe(false);
  });

  test('mortgage due day past month end falls on the last day of the month', () => {
    const mortgage = makeAccount({ type: AccountType.MORTGAGE, interestRate: 6, dueDate: '2026-01-31' });
    expect(isInterestDue(mortgage, '2026-02-28')).toBe(true);
    expect(isInterestDue(mortgage, '2026-02-27')).toBe(false);
    expect(isInterestDue(mortgage, '2026-03-31')).toBe(true);
  });

  test('interest amounts: rate is annual percent, cents rounded', () => {
    const savings  = makeAccount({ type: AccountType.SAVINGS, interestRate: 3.65 });
    const mortgage = makeAccount({ type: AccountType.MORTGAGE, interestRate: 6 });
    // $10,000 at 3.65%: 0.01% per day = exactly 100 cents
    expect(calculateInterestCents(savings, 1_000_000)).toBe(100);
    // $300,000 at 6%: 0.5% per month = exactly $1,500.00
    expect(calculateInterestCents(mortgage, 30_000_000)).toBe(150_000);
  });

  test('a string interestRate (legacy data) still computes', () => {
    const account = makeAccount({ type: AccountType.SAVINGS, interestRate: '3.65' as any });
    expect(calculateInterestCents(account, 1_000_000)).toBe(100);
  });

  test('savings balance compounds daily on the running balance', () => {
    const savings = makeAccount({ type: AccountType.SAVINGS, interestRate: 3.65, currentBalance: 1_000_000 });
    const result = runProjection({
      accounts: [savings], transactions: [], startKey: '2026-01-15', endKey: '2026-01-17',
    });
    const balances = result.balanceByDateAndAccount[savings.id];
    expect(balances['2026-01-15']).toBe(1_000_100);
    expect(balances['2026-01-16']).toBe(1_000_200);
    expect(balances['2026-01-17']).toBe(1_000_300);
  });

  test('no interest accrues on non-positive balances', () => {
    const card = makeAccount({
      type: AccountType.CREDIT_CARD, isLiability: true, interestRate: 20, currentBalance: 0,
    });
    const result = runProjection({
      accounts: [card], transactions: [], startKey: '2026-01-15', endKey: '2026-01-20',
    });
    expect(result.balanceByDateAndAccount[card.id]['2026-01-20']).toBe(0);
  });
});

describe('mortgage amortization (interest on the OPENING balance, then payment)', () => {
  test('matches a standard amortization schedule month by month', () => {
    // $300,000 at 6% for 30 years: payment $1,798.65, month-1 interest $1,500.00
    const mortgage = makeAccount({
      type: AccountType.MORTGAGE, isLiability: true, interestRate: 6,
      currentBalance: 30_000_000, dueDate: '2026-01-15',
    });
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000_000 });
    const payment = makeRecurring(RecurrenceFrequency.MONTHLY, {
      type: TransactionType.TRANSFER,
      amount: 179_865,
      start_date: '2026-01-15',
      fromAccount: checking.id,
      toAccount: mortgage.id,
    });

    const result = runProjection({
      accounts: [mortgage, checking], transactions: [payment],
      startKey: '2026-01-01', endKey: '2026-04-01',
    });
    const balances = result.balanceByDateAndAccount[mortgage.id];

    // Month 1: 30,000,000 * 1.005 = 30,150,000 → minus payment = 29,970,135
    expect(balances['2026-01-15']).toBe(29_970_135);
    // Balance is untouched between due dates (no daily accrual on mortgages)
    expect(balances['2026-02-14']).toBe(29_970_135);
    // Month 2: 29,970,135 + round(149,850.675) = 30,119,986 → 29,940,121
    expect(balances['2026-02-15']).toBe(29_940_121);
    // Month 3: 29,940,121 + round(149,700.605) = 30,089,822 → 29,909,957
    expect(balances['2026-03-15']).toBe(29_909_957);

    // The paying account dropped by exactly three payments
    expect(result.balanceByDateAndAccount[checking.id]['2026-04-01'])
      .toBe(100_000_000 - 3 * 179_865);
  });

  test('payoff: payments cap at the amount owed, balance never goes negative', () => {
    const loan = makeAccount({
      type: AccountType.LOAN, isLiability: true, currentBalance: 50_000,
      notifyOnAccountPayoff: true,
    });
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 1_000_000 });
    const payment = makeRecurring(RecurrenceFrequency.MONTHLY, {
      type: TransactionType.TRANSFER,
      amount: 20_000,
      start_date: '2026-02-01',
      fromAccount: checking.id,
      toAccount: loan.id,
    });

    const result = runProjection({
      accounts: [loan, checking], transactions: [payment],
      startKey: '2026-01-25', endKey: '2026-05-15',
    });
    const balances = result.balanceByDateAndAccount[loan.id];

    expect(balances['2026-02-01']).toBe(30_000);
    expect(balances['2026-03-01']).toBe(10_000);
    expect(balances['2026-04-01']).toBe(0);     // capped final payment
    expect(balances['2026-05-01']).toBe(0);     // stays paid off, never negative

    // Checking only paid the true 50,000 total (200 + 200 + 100 + 0)
    expect(result.balanceByDateAndAccount[checking.id]['2026-05-15']).toBe(1_000_000 - 50_000);

    // Exactly one payoff message despite repeated capped payments
    const messages = result.accountMessages[loan.id] || [];
    expect(messages.filter((m) => m.type === 'accountPayoff')).toHaveLength(1);
  });
});

describe('transaction balance arithmetic', () => {
  test('transfer signs: paying a liability reduces it and reduces the source', () => {
    const card = makeAccount({ type: AccountType.CREDIT_CARD, isLiability: true, currentBalance: 40_000 });
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000 });
    const payment = makeTransaction({
      type: TransactionType.TRANSFER, amount: 10_000, start_date: '2026-01-16',
      fromAccount: checking.id, toAccount: card.id,
    });
    const result = runProjection({
      accounts: [card, checking], transactions: [payment],
      startKey: '2026-01-15', endKey: '2026-01-17',
    });
    expect(result.balanceByDateAndAccount[card.id]['2026-01-17']).toBe(30_000);
    expect(result.balanceByDateAndAccount[checking.id]['2026-01-17']).toBe(90_000);
  });

  test('withdrawal from a liability grows what you owe; deposit to a liability shrinks it', () => {
    const card = makeAccount({ type: AccountType.CREDIT_CARD, isLiability: true, currentBalance: 10_000 });
    const spend = makeTransaction({
      type: TransactionType.WITHDRAWAL, amount: 2_500, start_date: '2026-01-16', fromAccount: card.id,
    });
    const refund = makeTransaction({
      type: TransactionType.DEPOSIT, amount: 1_000, start_date: '2026-01-17', toAccount: card.id,
    });
    const result = runProjection({
      accounts: [card], transactions: [spend, refund],
      startKey: '2026-01-15', endKey: '2026-01-18',
    });
    const balances = result.balanceByDateAndAccount[card.id];
    expect(balances['2026-01-16']).toBe(12_500);
    expect(balances['2026-01-17']).toBe(11_500);
  });

  test('withdrawal and deposit on a normal account', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 50_000 });
    const rent = makeTransaction({
      type: TransactionType.WITHDRAWAL, amount: 20_000, start_date: '2026-01-16', fromAccount: checking.id,
    });
    const paycheck = makeTransaction({
      type: TransactionType.DEPOSIT, amount: 100_000, start_date: '2026-01-17', toAccount: checking.id,
    });
    const result = runProjection({
      accounts: [checking], transactions: [rent, paycheck],
      startKey: '2026-01-15', endKey: '2026-01-18',
    });
    const balances = result.balanceByDateAndAccount[checking.id];
    expect(balances['2026-01-16']).toBe(30_000);
    expect(balances['2026-01-17']).toBe(130_000);
  });

  test('transactions referencing missing accounts are ignored without crashing', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 50_000 });
    const orphan = makeTransaction({
      type: TransactionType.TRANSFER, amount: 10_000, start_date: '2026-01-16',
      fromAccount: checking.id, toAccount: 'deleted-account',
    });
    const result = runProjection({
      accounts: [checking], transactions: [orphan],
      startKey: '2026-01-15', endKey: '2026-01-17',
    });
    expect(result.balanceByDateAndAccount[checking.id]['2026-01-17']).toBe(50_000);
  });
});

describe('messages', () => {
  test('overdraft message fires once per type', () => {
    const checking = makeAccount({
      type: AccountType.CHECKING, currentBalance: 5_000, notifyOnAccountOverDraft: true,
    });
    const bigSpend = makeRecurring(RecurrenceFrequency.MONTHLY, {
      type: TransactionType.WITHDRAWAL, amount: 10_000, start_date: '2026-01-20', fromAccount: checking.id,
    });
    const result = runProjection({
      accounts: [checking], transactions: [bigSpend],
      startKey: '2026-01-15', endKey: '2026-03-15',
    });
    const messages = result.accountMessages[checking.id] || [];
    expect(messages.filter((m) => m.type === 'accountOverdraft')).toHaveLength(1);
    expect(messages[0].date).toBe('2026-01-20');
  });

  test('snoozed messages within 7 days are suppressed', () => {
    const account = makeAccount({
      type: AccountType.CHECKING, currentBalance: 5_000, notifyOnAccountOverDraft: true,
      snoozedMessages: [{ messageType: 'accountOverdraft', date: '2026-01-13' }],
    });
    const overdraft = makeTransaction({
      type: TransactionType.WITHDRAWAL, amount: 10_000, start_date: '2026-01-16', fromAccount: account.id,
    });
    const result = runProjection({
      accounts: [account], transactions: [overdraft],
      startKey: '2026-01-15', endKey: '2026-01-17',
    });
    expect(result.accountMessages[account.id] || []).toHaveLength(0);
  });

  test('stale-account message appears when lastUpdated is over a month old', () => {
    const account = makeAccount({
      type: AccountType.CHECKING,
      notifyOnAccountStale: true,
      lastUpdated: '2025-11-01T00:00:00.000Z',
    });
    const result = runProjection({
      accounts: [account], transactions: [], startKey: '2026-01-15', endKey: '2026-01-16',
    });
    const messages = result.accountMessages[account.id] || [];
    expect(messages.filter((m) => m.type === 'accountStale')).toHaveLength(1);
  });
});

describe('spend tallies', () => {
  test('deposits are excluded from categorySpend but counted in spendByTransaction', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000 });
    const groceries = makeTransaction({
      type: TransactionType.WITHDRAWAL, amount: 5_000, start_date: '2026-01-16',
      fromAccount: checking.id, category: 'Food',
    });
    const paycheck = makeTransaction({
      type: TransactionType.DEPOSIT, amount: 200_000, start_date: '2026-01-16',
      toAccount: checking.id, category: 'Income',
    });
    const result = runProjection({
      accounts: [checking], transactions: [groceries, paycheck],
      startKey: '2026-01-15', endKey: '2026-01-17',
    });
    expect(result.categorySpend['Food']).toBe(5_000);
    expect(result.categorySpend['Income']).toBeUndefined();
    expect(result.spendByTransaction[groceries.event_id]).toBe(5_000);
    expect(result.spendByTransaction[paycheck.event_id]).toBe(200_000);
  });

  test('spend window stops at three years out', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000 });
    const yearly = makeRecurring(RecurrenceFrequency.YEARLY, {
      type: TransactionType.WITHDRAWAL, amount: 1_000, start_date: '2026-06-01',
      fromAccount: checking.id, category: 'Annual',
    });
    const result = runProjection({
      accounts: [checking], transactions: [yearly],
      startKey: '2026-01-15', endKey: '2030-06-15',
    });
    // Occurrences 2026/2027/2028 are inside [start, start+3y]; 2029/2030 are not.
    expect(result.categorySpend['Annual']).toBe(3_000);
  });
});

describe('floating transactions (autoClear: false)', () => {
  test('a past uncleared withdrawal floats and shifts the projection from day 1', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000 });
    const check = makeTransaction({
      type: TransactionType.WITHDRAWAL, amount: 25_000, start_date: '2026-03-05',
      fromAccount: checking.id, autoClear: false, transactionName: 'Pay George',
    });
    const result = runProjection({
      accounts: [checking], transactions: [check],
      startKey: '2026-03-15', endKey: '2026-03-20',
    });

    expect(result.floatingTransactions).toHaveLength(1);
    expect(result.floatingTransactions[0].date).toBe('2026-03-05');
    const balances = result.balanceByDateAndAccount[checking.id];
    expect(balances['2026-03-15']).toBe(75_000);
    expect(balances['2026-03-20']).toBe(75_000);
  });

  test('a past uncleared deposit floats and raises the projection', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000 });
    const invoice = makeTransaction({
      type: TransactionType.DEPOSIT, amount: 150_000, start_date: '2026-03-01',
      toAccount: checking.id, autoClear: false, transactionName: 'Seedling Pay',
    });
    const result = runProjection({
      accounts: [checking], transactions: [invoice],
      startKey: '2026-03-15', endKey: '2026-03-16',
    });
    expect(result.floatingTransactions).toHaveLength(1);
    expect(result.balanceByDateAndAccount[checking.id]['2026-03-15']).toBe(250_000);
  });

  test('cleared occurrences do not float and have no math effect', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000 });
    const check = makeTransaction({
      type: TransactionType.WITHDRAWAL, amount: 25_000, start_date: '2026-03-05',
      fromAccount: checking.id, autoClear: false, clearedDates: ['2026-03-05'],
    });
    const result = runProjection({
      accounts: [checking], transactions: [check],
      startKey: '2026-03-15', endKey: '2026-03-16',
    });
    expect(result.floatingTransactions).toHaveLength(0);
    expect(result.balanceByDateAndAccount[checking.id]['2026-03-15']).toBe(100_000);
  });

  test('autoClear true/undefined past transactions are ignored (original behavior)', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000 });
    const normal = makeTransaction({
      type: TransactionType.WITHDRAWAL, amount: 25_000, start_date: '2026-03-05',
      fromAccount: checking.id,
    });
    const explicit = makeTransaction({
      type: TransactionType.WITHDRAWAL, amount: 10_000, start_date: '2026-03-06',
      fromAccount: checking.id, autoClear: true,
    });
    const result = runProjection({
      accounts: [checking], transactions: [normal, explicit],
      startKey: '2026-03-15', endKey: '2026-03-16',
    });
    expect(result.floatingTransactions).toHaveLength(0);
    expect(result.balanceByDateAndAccount[checking.id]['2026-03-15']).toBe(100_000);
  });

  test('recurring: uncleared past occurrences stack; future ones stay on their dates', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000 });
    const weekly = makeRecurring(RecurrenceFrequency.WEEKLY, {
      type: TransactionType.WITHDRAWAL, amount: 10_000, start_date: '2026-02-23',
      fromAccount: checking.id, autoClear: false, clearedDates: ['2026-03-02'],
    });
    const result = runProjection({
      accounts: [checking], transactions: [weekly],
      startKey: '2026-03-15', endKey: '2026-03-20',
    });

    // Past occurrences Feb 23, Mar 2 (cleared), Mar 9 → two float
    expect(result.floatingTransactions.map((f) => f.date)).toEqual(['2026-02-23', '2026-03-09']);
    const balances = result.balanceByDateAndAccount[checking.id];
    // Day 1: two floating withdrawals
    expect(balances['2026-03-15']).toBe(80_000);
    // Future occurrence Mar 16 lands on its own date
    expect(balances['2026-03-16']).toBe(70_000);
  });

  test('an occurrence dated exactly today is NOT floating (normal window owns it; no double-count)', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000 });
    const todays = makeTransaction({
      type: TransactionType.WITHDRAWAL, amount: 25_000, start_date: '2026-03-15',
      fromAccount: checking.id, autoClear: false,
    });
    const result = runProjection({
      accounts: [checking], transactions: [todays],
      startKey: '2026-03-15', endKey: '2026-03-16',
    });
    expect(result.floatingTransactions).toHaveLength(0);
    expect(result.balanceByDateAndAccount[checking.id]['2026-03-15']).toBe(75_000);
  });

  test('occurrences older than the discovery window only float once recorded in pendingDates', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000 });
    const old = makeTransaction({
      type: TransactionType.DEPOSIT, amount: 50_000, start_date: '2025-06-01',
      toAccount: checking.id, autoClear: false,
    });

    const unseen = runProjection({
      accounts: [checking], transactions: [old],
      startKey: '2026-03-15', endKey: '2026-03-16',
    });
    expect(unseen.floatingTransactions).toHaveLength(0);

    const pinned = runProjection({
      accounts: [checking], transactions: [{ ...old, pendingDates: ['2025-06-01'] }],
      startKey: '2026-03-15', endKey: '2026-03-16',
    });
    expect(pinned.floatingTransactions.map((f) => f.date)).toEqual(['2025-06-01']);
    expect(pinned.balanceByDateAndAccount[checking.id]['2026-03-15']).toBe(150_000);
  });

  test('findUnrecordedPending reports new occurrences once, then converges', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000 });
    const check = makeTransaction({
      type: TransactionType.WITHDRAWAL, amount: 25_000, start_date: '2026-03-05',
      fromAccount: checking.id, autoClear: false,
    });

    const floating = expandFloatingOccurrences([check], '2026-03-15');
    const unrecorded = findUnrecordedPending(floating);
    expect(unrecorded).toEqual([{ event_id: check.event_id, dates: ['2026-03-05'] }]);

    // After recording, a second pass finds nothing new.
    const recorded = { ...check, pendingDates: ['2026-03-05'] };
    const secondPass = expandFloatingOccurrences([recorded], '2026-03-15');
    expect(findUnrecordedPending(secondPass)).toEqual([]);
  });

  test('exdated past occurrences never float, even when recorded as pending', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000 });
    const check = makeTransaction({
      type: TransactionType.WITHDRAWAL, amount: 25_000, start_date: '2026-03-05',
      fromAccount: checking.id, autoClear: false,
      exdates: ['2026-03-05'], pendingDates: ['2026-03-05'],
    });
    const result = runProjection({
      accounts: [checking], transactions: [check],
      startKey: '2026-03-15', endKey: '2026-03-16',
    });
    expect(result.floatingTransactions).toHaveLength(0);
    expect(result.balanceByDateAndAccount[checking.id]['2026-03-15']).toBe(100_000);
  });

  test('a floating withdrawal can trigger an overdraft warning dated today', () => {
    const checking = makeAccount({
      type: AccountType.CHECKING, currentBalance: 10_000, notifyOnAccountOverDraft: true,
    });
    const check = makeTransaction({
      type: TransactionType.WITHDRAWAL, amount: 25_000, start_date: '2026-03-05',
      fromAccount: checking.id, autoClear: false,
    });
    const result = runProjection({
      accounts: [checking], transactions: [check],
      startKey: '2026-03-15', endKey: '2026-03-16',
    });
    const messages = result.accountMessages[checking.id] || [];
    expect(messages.filter((m) => m.type === 'accountOverdraft')).toHaveLength(1);
    expect(messages[0].date).toBe('2026-03-15');
  });

  test('a floating payment transfer reduces the liability and the source on day 1', () => {
    const card = makeAccount({ type: AccountType.CREDIT_CARD, isLiability: true, currentBalance: 40_000 });
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100_000 });
    const payment = makeTransaction({
      type: TransactionType.TRANSFER, amount: 10_000, start_date: '2026-03-08',
      fromAccount: checking.id, toAccount: card.id, autoClear: false,
    });
    const result = runProjection({
      accounts: [card, checking], transactions: [payment],
      startKey: '2026-03-15', endKey: '2026-03-16',
    });
    expect(result.balanceByDateAndAccount[card.id]['2026-03-15']).toBe(30_000);
    expect(result.balanceByDateAndAccount[checking.id]['2026-03-15']).toBe(90_000);
  });
});

describe('projection window', () => {
  test('window is clamped to MAX_PROJECTION_DAYS', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100 });
    const result = runProjection({
      accounts: [checking], transactions: [], startKey: '2026-01-01', endKey: '2099-01-01',
    });
    expect(Object.keys(result.balanceByDateAndAccount[checking.id])).toHaveLength(MAX_PROJECTION_DAYS);
  });

  test('inverted window collapses to a single day instead of looping forever', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 100 });
    const result = runProjection({
      accounts: [checking], transactions: [], startKey: '2026-01-15', endKey: '2025-01-01',
    });
    expect(Object.keys(result.balanceByDateAndAccount[checking.id])).toEqual(['2026-01-15']);
  });

  test('30-year projection with recurring transactions completes in reasonable time', () => {
    const checking = makeAccount({ type: AccountType.CHECKING, currentBalance: 10_000_000 });
    const savings  = makeAccount({ type: AccountType.SAVINGS, currentBalance: 5_000_000, interestRate: 4 });
    const transactions = [
      makeRecurring(RecurrenceFrequency.DAILY, {
        type: TransactionType.WITHDRAWAL, amount: 500, start_date: '2026-01-01', fromAccount: checking.id,
      }),
      makeRecurring(RecurrenceFrequency.WEEKLY, {
        type: TransactionType.WITHDRAWAL, amount: 12_000, start_date: '2026-01-03', fromAccount: checking.id,
      }),
      makeRecurring(RecurrenceFrequency.MONTHLY, {
        type: TransactionType.TRANSFER, amount: 50_000, start_date: '2026-01-05',
        fromAccount: checking.id, toAccount: savings.id,
      }),
    ];

    const started = performance.now();
    const result = runProjection({
      accounts: [checking, savings], transactions,
      startKey: '2026-01-01', endKey: '2056-01-01',
    });
    const elapsed = performance.now() - started;

    expect(Object.keys(result.balanceByDateAndAccount[checking.id]).length).toBeGreaterThan(10_000);
    // Loose guard against O(n^2) regressions; the console timing is the real benchmark.
    expect(elapsed).toBeLessThan(10_000);
    // eslint-disable-next-line no-console
    console.log(`30-year projection: ${elapsed.toFixed(0)}ms`);
  });
});
