import React                               from 'react';
import { useDispatch, useSelector }        from 'react-redux';
import { startOfDay }                      from 'date-fns'

import { getAccountMessages }              from './../redux/slices/projections';
import { updateSnoozedMessages }           from './../redux/slices/accounts';
import { Account }                         from './../models/Account';
import { RootState }                       from './../redux/store';
import { SwipeElement }                    from './SwipeElement';

import messageFactory                      from './MessageFactory';

interface MessageProps {
  account         : Account;
  isSolo         ?: boolean;
  isCollapsible  ?: boolean;
  collapseControl?: boolean;
  color          ?: string;
}

const MessagesList: React.FC<MessageProps> = ({
  account,
  isSolo,
  isCollapsible,
  collapseControl,
  color,
}) => {
  const dispatch = useDispatch()

  const projections = useSelector((state: RootState) => state.projections);
  const messages    = getAccountMessages(projections, account);

  type MessageType = {
    type   : string;
    date   : string;
    account: Account;
    isSolo?: boolean; 
  };

  const handleMarkRead = (message: MessageType) => {    
    const newSnoozedMessage = { messageType: message.type, date: startOfDay(new Date()).toISOString() };
    
    dispatch(updateSnoozedMessages({ id: account.id, newSnoozedMessage }));
  };
  
  const createSwipeElement = (
    message: MessageType,
    index: number,
    handleMarkRead: (message: MessageType) => void, 
    color?: string,
    isSolo?: boolean
  ) => {
    return (
      <SwipeElement key={index}>
        <div
          className="glassjar__list-item__message"
          {...(color && { style: { background: color } })}
        >
          {messageFactory({ ...message, isSolo })}
        </div>
        <SwipeElement.Action action={() => handleMarkRead(message)}>  
          <div className="glassjar__swipe-icon">Snooze</div>
        </SwipeElement.Action>
      </SwipeElement>
    );
  };
  
  return (
    <>
      {messages
        .slice(0, 3)
        .map((message, index) =>
          createSwipeElement(message, index, handleMarkRead, color, isSolo)
        )}
      {isCollapsible && (
        <div
          className={`glassjar__auto-height glassjar__auto-height--top ${
            collapseControl ? 'open': ''
          }`}
        >
          {messages
            .slice(3)
            .map((message, index) =>
              createSwipeElement(message, index, handleMarkRead, color, isSolo)
            )}
        </div>
      )}
      {!isCollapsible &&
        messages
          .slice(3)
          .map((message, index) =>
            createSwipeElement(message, index, handleMarkRead, color, isSolo)
          )}
    </>
  );
};

export default MessagesList;
