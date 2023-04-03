import { useSelector, useDispatch }       from 'react-redux'
import { createRef, useEffect, useState } from 'react';
import { RootState }                      from './../redux/store';        
import { closeModal }                     from './../redux/slices/modal'

import './../css/Modal.css';

function Modal(this: any, props: { children?: any }) {
  const isModalOpen = useSelector((state: RootState) => state.modalState.value)

  const modal = createRef<HTMLDivElement>();
  const { children } = props
  const $children = Array.isArray(children) ? children : [children];
  const dispatch = useDispatch()
  const closeTheModal = () => {
    dispatch(closeModal())
  }

  return (
    <>{isModalOpen &&
      <div className='glassjar__modal' ref={modal}>
        <div className="glassjar__modal__backing" onClick={closeTheModal}></div>
        <div className="glassjar__modal__body">
          <div className="glassjar__modal__close" onClick={closeTheModal}><i className="fa-solid fa-xmark"></i></div>
          <div className="glassjar__modal__content">
            {$children?.map((child: any, index: number) => {
              return (
                <div key={index}>
                  {child}
                </div>
              )
            }
            )}
          </div>
        </div>
      </div>
    }</>
  )
}

export default Modal;


