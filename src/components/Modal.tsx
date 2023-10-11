import React, { useEffect, useState } from 'react';

import './../css/Modal.css';

interface modalProps {
  onClose   : any,
  isOpen    : boolean,
  children ?: any,
  hideClose?: boolean,
  color    ?: string,
}

const Modal: React.FC<modalProps> = React.memo(
  ({ children, isOpen, onClose: closer, color }) => {

    const open                      = isOpen;
    const theChildren               = Array.isArray(children) ? children : [children];
    const [showModal, setShowModal] = useState<boolean>(false)

    const closeTheModal = () => {
        closer();
    }

    useEffect(() => {
      if (isOpen) {
        setShowModal(true)
      } else {
        setShowModal(false)
      }
    }, [isOpen]);

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }

    let style = {};

    if (color) {
      const rgb = hexToRgb(color);
      if (rgb) {
        style = { background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)` };
      }
    }

    return (
      <>
        {open &&
          <div className={`glassjar__modal ${(open && showModal) ? 'open' : ''}`}>
            <div className='glassjar__modal__backing' style={style} onClick={closeTheModal}></div>
            <div className='glassjar__modal__body'>
              {theChildren?.map((child: any, index: number) => {
                return (
                  <React.Fragment key={index}>
                    {child}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        }
      </>
    )
  }
);

export default Modal;


