import React                        from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState }                from './../redux/store';
import { setGraphRange }            from './../redux/slices/views';

const SpanChangeButton = () => {
  const graphRange             = useSelector((state: RootState) => state.views.graphRange);

  const dispatch               = useDispatch();

  const rangeChoices: number[] = [1,3,6,12];

  const handleSpanChange = () => {
    let currentIndex = rangeChoices.findIndex(value => value === graphRange);
    let nextIndex    = (currentIndex + 1) % rangeChoices.length;
    dispatch(setGraphRange(rangeChoices[nextIndex]));
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
