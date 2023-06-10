import React, { useEffect, useRef, useState } from "react";
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
  const menuRef = useRef<HTMLDivElement | null>(null);

  const menuClick = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // End of useEffect block

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

  return <div ref={menuRef} className={theClassName}>{renderChildren()}</div>;
};

Menu.Button = MenuButton;
Menu.Body = MenuBody;

export default Menu;
