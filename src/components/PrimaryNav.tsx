import { useDispatch, useSelector }           from 'react-redux';
import React, { useEffect, useRef, useState } from 'react';

import { setView }                            from './../redux/slices/views';
import { RootState }                          from '../redux/store';

import { colorPalette }                       from '../data/ColorPalette';

import "./../css/Nav.css";

type StyleState = {
  left ?: string;
  width?: string;
  color?: string; 
};

const PrimaryNav = () => {
  const buttons = [
    { label: "Calendar",     color: colorPalette[0], icon: "fa-calendar-days", view: "calendar" },
    { label: "Accounts",     color: colorPalette[1], icon: "fa-file-invoice",  view: "accounts" },
    { label: "Transactions", color: colorPalette[2], icon: "fa-jar",           view: "transactions" },
    { label: "Settings",     color: colorPalette[3], icon: "fa-gear",          view: "settings" },
    // { label: 'Outlooks',     icon: 'fa-chart-line',    view: 'outlook' },
    // { label: 'Categories',     icon: 'fa-chart-pie',     view: 'categories' },
  ];

  const dispatch = useDispatch();

  const [activeStyle, setActiveStyle] = useState<StyleState>({});

  const navRef = useRef<HTMLDivElement | null>(null);

  const activeView = useSelector((state: RootState) => state.views.activeView);

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
        left: `${left}px`,
        width: `${width}px`,
        color: buttonDetails.color,  
      });
    }
  };
  

  return (
    <div
      ref       = {navRef}
      className = {`glassjar__primary-nav`}
    >
      <div className = "glassjar__nav__backing-shape" style = {activeStyle}>
        <div style     = {{ background: activeStyle.color }}></div>
      </div>
      <div className = "glassjar__nav__backing-shape" style = {activeStyle}>
        <div style     = {{ background: activeStyle.color }}></div>
      </div>
      <div className = "glassjar__nav__backing-shape" style = {activeStyle}>
        <div style     = {{ background: activeStyle.color }}></div>
      </div>
      <div className = "glassjar__nav__backing-shape" style = {activeStyle}>
        <div style     = {{ background: activeStyle.color }}></div>
      </div>
      <div className = "glassjar__nav__backing-shape" style = {activeStyle}>
        <div style     = {{ background: activeStyle.color }}></div>
      </div>
      <div
        className='glassjar__primary-nav__icon-holder'
      >
        {buttons.map((button) => (
          <button
            key         = {button.view}
            data-target = {button.view}
            className   = {`glassjar__footer-nav__button${activeView === button.view ? " active" : ""}`}
            onClick = {() => setActiveView(button.view)}
          >
            <span>{button.label}</span>
            <i className = {`fa-fw fa-solid ${button.icon}`} />
          </button>
        ))}
      </div>
      <div className = "glassjar__nav__underline" style = {activeStyle}>
      <div style     = {{ background: activeStyle.color }}></div>
      </div>
    </div>
  );
};

export default PrimaryNav;
