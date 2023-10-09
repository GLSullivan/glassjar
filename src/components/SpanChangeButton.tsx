import React                        from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState }                from './../redux/store';
import { plusGraphRange }           from './../redux/slices/views';

const SpanChangeButton = () => {
  const graphRange             = useSelector((state: RootState) => state.views.graphRange);
  const dispatch               = useDispatch();

  const handleSpanChange = () => {
    dispatch(plusGraphRange())
  };

  return (
    <button
      className = 'glassjar__button glassjar__button--small glassjar__button--span'
      onClick   = {() => handleSpanChange()}
    >
      {graphRange} Month{graphRange !== 1 && 's'}
    </button>
  );
};

export default SpanChangeButton;
