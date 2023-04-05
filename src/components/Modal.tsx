import './../css/Modal.css';

function Modal(props: { children?: any; onClose: any; isOpen: boolean }) {
  const { children, isOpen, onClose: closer } = props
  const open = isOpen;
  const theChildren = Array.isArray(children) ? children : [children];
  const closeTheModal = () => {
    closer();
  }

  return (
    <>{open &&
      <div className='glassjar__modal'>
        <div className="glassjar__modal__backing" onClick={closeTheModal}></div>
        <div className="glassjar__modal__body">
          <div className="glassjar__modal__close" onClick={closeTheModal}><i className="fa-solid fa-xmark"></i></div>
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


