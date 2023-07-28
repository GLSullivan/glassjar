import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setView } from './../redux/slices/views';
import { RootState } from '../redux/store';

import './../css/Nav.css';

const PrimaryNav = () => {
  const dispatch = useDispatch();

  const [showMore, setShowMore] = useState<boolean>(false);


  const activeView = useSelector((state: RootState) => state.views.activeView);

  const setActiveView = (view: string) => {
    dispatch(setView(view));
  };

  return (
    <div className={`glassjar__primary-nav ${showMore ? '' : 'open'}`} >

      <button className={`glassjar__primary-nav__more ${showMore ? '' : 'open'}`} onClick={() => setShowMore(!showMore)}>
        <i className={`fa-fw fa-duotone fa-jar glassjar__primary-nav__more-icon ${showMore ? '' : 'open'}`} />
      </button>







      
      <div className='glassjar__primary-nav__icon-holder'>
        <div><i onClick={() => { setActiveView('calendar') }} className={'glassjar__footer-nav__button fa-fw fa-solid fa-calendar-days' + (activeView === 'calendar' ? ' active' : '')} /></div>
        <div><i onClick={() => { setActiveView('accounts') }} className={'glassjar__footer-nav__button fa-fw fa-solid fa-file-invoice' + (activeView === 'accounts' ? ' active' : '')} /></div>
        <div><i onClick={() => { setActiveView('transactions') }} className={'glassjar__footer-nav__button fa-fw fa-solid fa-jar' + (activeView === 'transactions' ? ' active' : '')} /></div>
        <div><i onClick={() => { setActiveView('outlook') }} className={'glassjar__footer-nav__button fa-fw fa-solid fa-chart-line' + (activeView === 'outlook' ? ' active' : '')} /></div>
        <div><i onClick={() => { setActiveView('categories') }} className={'glassjar__footer-nav__button fa-fw fa-solid fa-chart-pie' + (activeView === 'categories' ? ' active' : '')} /></div>
        <div><i onClick={() => { setActiveView('settings') }} className={'glassjar__footer-nav__button fa-fw fa-solid fa-gear' + (activeView === 'settings' ? ' active' : '')} /></div>
      </div>

    </div>
  )
};

export default PrimaryNav;
