import React                          from 'react';
import { useDispatch, useSelector }   from 'react-redux';

import { getAccountMessages }         from '../redux/slices/projections';

import { Account }                    from '../models/Account';
import { RootState }                  from '../redux/store';

import messageFactory                 from './MessageFactory';

interface MessageProps {
  account: Account;
  isSolo?: boolean;
}

const MessagesList: React.FC<MessageProps> = ({ account, isSolo }) => {
  const state = useSelector((state: RootState) => state);
  const messages = getAccountMessages(state, account);
console.log(messages)
  return (
    <>
      {messages.map((message, index) => (
        <div className="glassjar__list-item__message" key={index}>
          {messageFactory({ ...message, isSolo })}
        </div>
      ))}
    </>
  );
};

export default MessagesList;
