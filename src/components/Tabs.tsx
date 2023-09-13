import React, { ReactNode, useEffect, useRef, useState } from "react";

import { colorPalette } from "../data/ColorPalette";

import "./../css/Nav.css";

type StyleState = {
  left?: string;
  width?: string;
  color?: string;
};

interface TabsItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  heading?: string;
  isOpen?: boolean;
  toggleTabs?: (index: number) => void;
}

interface TabsProps {
  children: ReactNode;
}

const Tabs: React.FC<TabsProps> & { Item: React.FC<TabsItemProps> } = ({
  children,
}) => {
  const toggleTabs = (index: number) => {
    setOpenTabsIndex((prevIndex) => (prevIndex === index ? prevIndex : index));
  };

  const [openTabsIndex, setOpenTabsIndex] = useState<number>(0);
  const [activeStyle, setActiveStyle] = useState<StyleState>({});

  const navRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setUnderlinePosition();
    }, 0);
    // eslint-disable-next-line
  }, [openTabsIndex]);

  const setUnderlinePosition = () => {
    if (!navRef.current) return;
    const activeChild = React.Children.toArray(children)[openTabsIndex];

    if (React.isValidElement(activeChild) && activeChild.props.heading) {
      const navItem = navRef.current.querySelector(
        `button[data-target='${activeChild.props.heading}']`
      );
      if (!navItem) return;

      const bounds = navItem.getBoundingClientRect();
      const parentBounds = navRef.current.getBoundingClientRect();
      const left = bounds.left - parentBounds.left;
      const width = bounds.width;

      setActiveStyle({
        left: `${left}px`,
        width: `${width}px`,
        color: colorPalette[openTabsIndex],
      });
    }
  };

  const renderHeaders = () => {
    return (
      <div ref={navRef} className={`glassjar__nav`}>
        <div className="glassjar__nav__icon-holder">
          {React.Children.map(children, (child: any, index) => {
            if (child.props.heading) {
              return (
                <button
                  key={child.props.heading}
                  data-target={child.props.heading}
                  className={`glassjar__nav__button${
                    openTabsIndex === index ? " active" : ""
                  }`}
                  onClick={() => toggleTabs(index)}
                >
                  {child.props.heading}
                </button>
              );
            }
          })}
        </div>
        <div className="glassjar__nav__underline" style={activeStyle}>
          <div style={{ background: activeStyle.color }}></div>
        </div>
      </div>
    );
  }

  const renderChildren = () =>
    React.Children.map(children, (child, index) => {
      if (
        React.isValidElement<TabsItemProps>(child) &&
        child.type === Tabs.Item
      ) {
        return React.cloneElement(child, {
          isOpen    : openTabsIndex === index,
          toggleTabs: () => toggleTabs(index),
        });
      }
      return child;
    });

return (
  <>
    {renderHeaders()}
    {renderChildren()}
  </>
)
  
};

export default Tabs;

const TabsItem: React.FC<TabsItemProps> = ({ children, isOpen }) => {
  return (
    <div className={`glassjar__tabs ${isOpen ? "glassjar__tabs--open" : ""}`}>
      {isOpen && (
        <div className="glassjar__tabs__body">
          <div className="glassjar__tabs__body-content">{children}</div>
        </div>
      )}
    </div>
  );
};

Tabs.Item = TabsItem;
