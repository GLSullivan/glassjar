import React, { useState, ReactNode } from 'react';

import './../css/Tabs.css';

interface TabsProps {
  children: ReactNode;
}

interface TabsItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children  ?: React.ReactNode;
  heading   ?: string;
  isOpen    ?: boolean;
  toggleTabs?: (index: number) => void;
}

const Tabs: React.FC<TabsProps> & { Item: React.FC<TabsItemProps> } = ({
  children,
}) => {
  const [openTabsIndex, setOpenTabsIndex] = useState<number | null>(0);

  const toggleTabs = (index: number) => {
    setOpenTabsIndex((prevIndex) => (prevIndex === index ? -1 : index));
  };

    // Render all children, ensuring only the selected tab's content is visible
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

    // We render the tab headers separately from the content
  const renderHeaders = () =>
    React.Children.map(children, (child, index) => {
      if (
        React.isValidElement<TabsItemProps>(child) &&
        child.type === Tabs.Item
      ) {
        return (
          <div
            onClick   = {() => toggleTabs(index)}
            className = {`glassjar__tabs__header ${
              openTabsIndex === index ? 'glassjar__tabs__header--open' : ''
            }`}
          >
            {child.props.heading}
          </div>
        );
      }
      return null;
    });

  return (
    <div className = 'glassjar__tabs-group'>
    <div className = 'glassjar__tabs__headers'>{renderHeaders()}</div>
    <div className = 'glassjar__tabs__content'>{renderChildren()}</div>
    </div>
  );
};

const TabsItem: React.FC<TabsItemProps> = ({
  children,
  isOpen,
}) => {
  return (
    <div className={`glassjar__tabs ${isOpen ? 'glassjar__tabs--open' : ''}`}>
      {isOpen && (
        <div className='glassjar__tabs__body'>
          <div className='glassjar__tabs__body-content' >
            {children}
          </div>
        </div>
      )}
    </div>
  );
};


Tabs.Item = TabsItem;
export default Tabs;
