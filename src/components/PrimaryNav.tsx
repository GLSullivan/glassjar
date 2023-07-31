import { useDispatch, useSelector }   from "react-redux";
import React, { useEffect, useState } from "react";

import { setView }                    from "./../redux/slices/views";
import { RootState }                  from "../redux/store";

import "./../css/Nav.css";

const PrimaryNav = () => {
  const buttons = [
    { label: 'Calendar',     icon: 'fa-calendar-days', view: 'calendar' },
    { label: 'Accounts',     icon: 'fa-file-invoice',  view: 'accounts' },
    { label: 'Transactions', icon: 'fa-jar',           view: 'transactions' },
    // { label: 'Outlooks',     icon: 'fa-chart-line',    view: 'outlook' },
    { label: 'Settings',     icon: 'fa-gear',          view: 'settings' },
    // { label: 'Categories',     icon: 'fa-chart-pie',     view: 'categories' },
  ];

  const dispatch = useDispatch();

  const [showNav, setShowNav] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState(false);

  const activeView = useSelector((state: RootState) => state.views.activeView);

  const setActiveView = (view: string) => {
    console.log("?");
    setShowNav(false);
    dispatch(setView(view));
  };

  useEffect(() => {
    if (showNav) {
      setIsExiting(false);
    } else {
      setIsExiting(true);

      const timer = setTimeout(() => {
        setIsExiting(false);
      }, 600); 

      return () => {
        clearTimeout(timer);
      };
    }
  }, [showNav]);

  return (
    <div
      className={`glassjar__primary-nav ${showNav ? "open" : ""} ${
        isExiting ? "exiting" : ""
      }`}
    >
      <button
        className={`glassjar__primary-nav__more ${showNav ? "" : "open"} ${
          isExiting ? "exiting" : ""
        }`}
        onClick={() => setShowNav(!showNav)}
      >
        <i
          className={`fa-fw fa-duotone fa-jar glassjar__primary-nav__more-icon ${
            showNav ? "open" : ""
          } ${isExiting ? "exiting" : ""}`}
        />
      </button>

      <div
        className={`glassjar__primary-nav__icon-holder ${
          showNav ? "open" : ""
        } ${isExiting ? "exiting" : ""}`}
      >
        {buttons.map((button, index) => (
          <button
            key={button.view}
            className={`glassjar__footer-nav__button${
              activeView === button.view ? " active" : ""
            } ${isExiting ? "exiting" : ""}`}
            onClick={() => setActiveView(button.view)}
            style={{
              transitionDelay: `${(buttons.length - index) * 0.1}s`,
            }}
          >
            <span>{button.label}</span>
            <i className={`fa-fw fa-solid ${button.icon}`} />
          </button>
        ))}
      </div>
      <div
        className={`glassjar__primary-nav__backing ${showNav ? "open" : ""} ${
          isExiting ? "exiting" : ""
        }`}
        onClick={() => setShowNav(false)}
      >
        <p className='glassjar__version'>Version: {process.env.REACT_APP_VERSION}</p>
      </div>
    </div>
  );
};

export default PrimaryNav;
