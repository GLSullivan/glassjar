import React from 'react';
import { useSelector } from 'react-redux';

import { getAccountMessages } from './../redux/slices/projections';

import { Account } from './../models/Account';
import { RootState } from './../redux/store';

import messageFactory from './MessageFactory';

interface MessageProps {
  account: Account;
  isSolo?: boolean;
  isCollapsible?: boolean;
  collapseControl?: boolean;
}

const MessagesList: React.FC<MessageProps> = ({ 
  account, 
  isSolo,
  isCollapsible,
  collapseControl,  
}) => {
  const state = useSelector((state: RootState) => state);
  const messages = getAccountMessages(state, account);

  return (
    <>
      {messages.slice(0, 3).map((message, index) => (
        <div className='glassjar__list-item__message' key={index}>
          {messageFactory({ ...message, isSolo })}
        </div>
      ))}

      {isCollapsible && (
        <div
          className={`glassjar__auto-height glassjar__auto-height--top ${
            collapseControl ? 'open' : ''
          }`}
        >
          {messages.slice(3).map((message, index) => (
            <div className='glassjar__list-item__message' key={index + 3}>
              {messageFactory({ ...message, isSolo })}
            </div>
          ))}
        </div>
      )}

      {!isCollapsible &&
        messages.slice(3).map((message, index) => (
          <div className='glassjar__list-item__message' key={index + 3}>
            {messageFactory({ ...message, isSolo })}
          </div>
        ))}
    </>
  );
};

export default MessagesList;
