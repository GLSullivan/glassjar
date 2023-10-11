import React                          from 'react';
import { useDispatch, useSelector }   from 'react-redux';

import { getAccountMessages }         from './../redux/slices/projections';
import { accountTypeIcons }           from './../data/AccountTypeIcons';
import { accountColors }              from './../data/AccountColors';
import { setActiveAccount }           from './../redux/slices/accounts';
import { openAccountForm }            from './../redux/slices/modals';
import { Account }                    from './../models/Account';
import { RootState }                  from './../redux/store';

import MessagesList                   from './MessageList';

import './../css/Pages.css'

const MessagesPage: React.FC = () => { 

  const dispatch = useDispatch();

  const state    = useSelector((state: RootState) => state);
  const messages = getAccountMessages(state);

    // Group messages by account
  const groupedMessages: {
    [accountId: string]: { type: string; date: string; account: Account }[];
  } = {};
  messages.forEach(({ accountId, type, date, account }) => {
    if (!groupedMessages[accountId]) {
      groupedMessages[accountId] = [];
    }
    groupedMessages[accountId].push({ type, date, account });
  });

  return (
    <div  className='glassjar__page glassjar__page--messages'>
      <h2>Messages</h2>
<div className="glassjar__flex glassjar__flex--column">
      {Object.keys(groupedMessages).length > 0 ? (
        <>
          {Object.keys(groupedMessages).map((accountId) => (
            <div key={accountId} className='glassjar__list-item glassjar__list-item--account glassjar__list-item--message'
            onClick={() => {
              dispatch(setActiveAccount(groupedMessages[accountId][0].account));
              dispatch(openAccountForm());
            }}           
            >
              <div
                className='glassjar__list-item__header'
                style={{
                  background:
                    accountColors[
                      groupedMessages[accountId][0].account.color
                    ],
                }}
              >
                <div className='glassjar__list-item__icon'>
                  <i
                    className={
                      accountTypeIcons[
                        groupedMessages[accountId][0].account.type
                      ]
                    }
                  />
                </div>
                <div className='glassjar__list-item__header--mid'>
                  <div className='glassjar__list-item__headline'>
                    <h4>{groupedMessages[accountId][0].account.name}</h4>
                  </div>
                </div>
              </div>
              <MessagesList account={groupedMessages[accountId][0].account}></MessagesList>
              <div
                className='glassjar__list-item__backing'
                style={{ background: accountColors[groupedMessages[accountId][0].account.color] }}
              />
            </div>
          ))}
          
        </>
      ) : (
        <p>You have no messages</p>
      )}
      </div>
    </div>
  );
};

export default MessagesPage;
