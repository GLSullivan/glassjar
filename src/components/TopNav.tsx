import { useDispatch, useSelector } from 'react-redux';
import React, { useState }          from 'react';

import SpanChangeButton             from './SpanChangeButton';

import { setView }                  from './../redux/slices/views';
import { RootState }                from './../redux/store';

import Icon from './../media/images/header-icon.png'

import './../css/Nav.css';

const TopNav = () => {
  const dispatch = useDispatch();

  const [imageError, setImageError] = useState(false);
  const [prevView, setPrevView]     = useState<string | null>(null);

  const userPhoto  = useSelector((state: RootState) => state.userInfo.photo);
  const activeView = useSelector((state: RootState) => state.views.activeView);

  const setActiveView = (view: string) => {
    if (activeView !== 'settings') {
      setPrevView(activeView); 
      dispatch(setView(view));
    } else {
      if (prevView) {
        dispatch(setView(prevView)); 
      } else {
        dispatch(setView('calendar')); // If there is no previous view, just head back to the calendar
      }
    }
  };

  return (
    <div className = 'glassjar__top-nav'>
      <div><img src={Icon} alt='Glass Jar by Greg Sullivan' /></div>
      <SpanChangeButton />
      <div
        onClick   = {() => setActiveView('settings')}
        className = {`glassjar__nav__button${activeView === 'settings' ? ' active' : ''}`}
      >
    {!imageError && userPhoto ? (
        <img 
          src={userPhoto} 
          alt='User' 
          onError={() => setImageError(true)}
        />
      ) : (
        <i className='fa-solid fa-gear' />
      )}
      </div>
    </div>
  );
};

export default TopNav;
