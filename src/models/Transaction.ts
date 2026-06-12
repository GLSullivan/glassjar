import {
  RecurrenceFrequency,
  TransactionType,
  CustomIntervalType,
} from './../utils/constants';

export interface Transaction {
  transactionName: string;
  type           : TransactionType;
  amount         : number;

  event_id    : string;
  description : string;
  ends       ?: boolean;

  isRecurring         : boolean;
  recurrenceInterval  : number;
  recurrenceFrequency?: RecurrenceFrequency;
  customIntervalType ?: CustomIntervalType;

  // New Values
  start_date : string;    
  end_date  ?: string;
  rrule      : string;
  exdates   ?: string[];

  givenDays      : number[];
  arbitraryDates?: string[];

  showInCalendar: boolean;

  fromAccount  ?: string;
  toAccount    ?: string;
  updatedAt    ?: number;
  category     ?: string;
  discretionary?: boolean;  // Future feature for sorting, showing things that are required.

  fromHelper?: string;

  /**
   * true/undefined: past occurrences are assumed settled (baked into account
   * balances) and drop out of the projection — the original behavior.
   * false: past occurrences FLOAT — they stack as "past due", keep affecting
   * the projection from today forward, and must be cleared by hand.
   */
  autoClear?: boolean;

  /** Occurrence DateKeys the user has cleared (settled at the bank). */
  clearedDates?: string[];

  /**
   * Occurrence DateKeys that have been seen floating at least once. Once
   * recorded here an occurrence never expires out of the past-due list —
   * it floats until explicitly cleared.
   */
  pendingDates?: string[];
}
