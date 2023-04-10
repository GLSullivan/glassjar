import './../css/Modal.css';

function Modal(props: { children?: any; onClose: any; isOpen: boolean, hideClose?: boolean}) {
  const { children, isOpen, onClose: closer, hideClose } = props
  const open = isOpen;
  const hideCloseButton: boolean = hideClose || false;
  const theChildren = Array.isArray(children) ? children : [children];

  const closeTheModal = () => {
    if (!hideCloseButton) {
      closer();
    }
  }

  return (
    <>{open &&
      <div className='glassjar__modal'>
        <div className="glassjar__modal__backing" onClick={closeTheModal}></div>
        <div className="glassjar__modal__body">
          {!hideCloseButton && <div className="glassjar__modal__close" onClick={closeTheModal}><i className="fa-solid fa-xmark" /></div>}
          <div className="glassjar__modal__content">
            {theChildren?.map((child: any, index: number) => {
              return (
                <div key={index}>
                  {child}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    }</>
  )
}

export default Modal;


