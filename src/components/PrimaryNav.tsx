import { useDispatch, useSelector }           from 'react-redux';
import React, { useEffect, useRef, useState } from 'react';

import { setView }                            from './../redux/slices/views';
import { RootState }                          from '../redux/store';

import { interfaceColors }                       from '../data/InterfaceColors';

import './../css/Nav.css';

type StyleState = {
  left ?: string;
  width?: string;
  color?: string; 
};

const PrimaryNav = () => {

  const messages = useSelector((state: RootState) => state.projections.accountMessages);
  const totalMessages = Object.values(messages).reduce((acc, messages) => acc + messages.length, 0);

  const buttons = [
    { label: 'Calendar',     color: interfaceColors[0], icon: 'fa-calendar-days',   view: 'calendar' },
    { label: 'Accounts',     color: interfaceColors[0], icon: 'fa-university',      view: 'accounts' },
    { label: 'Transactions', color: interfaceColors[0], icon: 'fa-money-bill-wave', view: 'transactions' },
    { label: 'Messages',     color: interfaceColors[0], icon: 'fa-envelope',        view: 'messages' },
  ];

  const dispatch = useDispatch();

  const [activeStyle, setActiveStyle] = useState<StyleState>({});

  const navRef = useRef<HTMLDivElement | null>(null);

  const activeView = useSelector((state: RootState) => state.views.activeView);

  const isActiveView = buttons.some(button => button.view === activeView);

  const setActiveView = (view: string) => {
    dispatch(setView(view));
  };

  useEffect(() => {
    setTimeout(() => {
      setUnderlinePosition(activeView);
    }, 0);
    // eslint-disable-next-line
  }, [activeView]);

  const setUnderlinePosition = (section: string) => {
    if (!navRef.current) return;
  
    const buttonDetails = buttons.find(button => button.view === section);
    if (!buttonDetails) return;  
  
    const navItem = navRef.current.querySelector(`button[data-target='${section}']`);
    if (navItem) {
      const bounds = navItem.getBoundingClientRect();
      const parentBounds = navRef.current.getBoundingClientRect();
      const left = bounds.left - parentBounds.left;
      const width = bounds.width;
      setActiveStyle({
        left : `${left}px`,
        width: `${width}px`,
        color: interfaceColors[0],
      });
    }
  };
  

  return (
    <div
      ref       = {navRef}
      className={`glassjar__nav glassjar__nav--primary${isActiveView ? '' : ' inactive'}`}
    >
      <div className = 'glassjar__nav__backing-shape' style = {activeStyle}>
        <div style     = {{ background: activeStyle.color }}></div>
      </div>
      <div className = 'glassjar__nav__backing-shape' style = {activeStyle}>
        <div style     = {{ background: activeStyle.color }}></div>
      </div>
      <div className = 'glassjar__nav__backing-shape' style = {activeStyle}>
        <div style     = {{ background: activeStyle.color }}></div>
      </div>
      <div className = 'glassjar__nav__backing-shape' style = {activeStyle}>
        <div style     = {{ background: activeStyle.color }}></div>
      </div>
      <div className = 'glassjar__nav__backing-shape' style = {activeStyle}>
        <div style     = {{ background: activeStyle.color }}></div>
      </div>
      <div
        className='glassjar__nav__icon-holder'
      >
        {buttons.map((button) => (
          <button
            key         = {button.view}
            data-target = {button.view}
            className   = {`glassjar__nav__button${activeView === button.view ? ' active' : ''}`}
            onClick = {() => setActiveView(button.view)}
          >
            <span>
              {button.label}
            </span>
            <div>
              <i className = {`fa-fw fa-solid ${button.icon}`} />
              {(button.view === 'messages' && totalMessages > 0) && <span className='glassjar__nav__pill' style={{background: button.color, color: 'var(--color-bright)'}}>{totalMessages}</span>}
            </div>
          </button>
        ))}
      </div>
      <div className = 'glassjar__nav__underline' style = {activeStyle}>
      <div style     = {{ background: activeStyle.color }}></div>
      </div>
    </div>
  );
};

export default PrimaryNav;