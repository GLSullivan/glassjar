import React, { useState } from "react";
import "./../css/Menu.css";

interface MenuProps {
  children: React.ReactNode;
  className?: string
}

interface MenuBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  isMenuOpen?: boolean;
}

interface MenuButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  menuClick?: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ children, menuClick }) => {
  const handleClick = () => {
    console.log("1");
    if (menuClick) {
      menuClick();
    }
  };

  return (
    <div onClick={handleClick} className="glassjar__menu__button">
      {children}
    </div>
  );
};

const MenuBody: React.FC<MenuBodyProps> = ({ children, isMenuOpen }) => {
  return (
    <div
      className={`glassjar__menu__body ${
        isMenuOpen ? "glassjar__menu__body--open" : ""
      }`}
    >
      {children}
    </div>
  );
};

const Menu: React.FC<MenuProps> & { Button: React.FC<MenuButtonProps> } & {
  Body: React.FC<MenuBodyProps>;
} = ({ children, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuClick = () => {
    setIsOpen(!isOpen);
  };

  let theClassName = "glassjar__menu"
  if (className) {
    theClassName += " " + className;
  }

  const renderChildren = () =>
    React.Children.map(children, (child) => {
      
      if (React.isValidElement<MenuBodyProps>(child) && child.type === MenuBody) {
          return React.cloneElement(child, {
            isMenuOpen: isOpen,
          });
      }

      if (
        React.isValidElement<MenuButtonProps>(child) &&
        child.type === MenuButton
      ) {
        return React.cloneElement(child, {
          menuClick: () => menuClick(),
        });
      }
    });

  return <div className={theClassName}>{renderChildren()}</div>;
};

Menu.Button = MenuButton;
Menu.Body = MenuBody;

export default Menu;
