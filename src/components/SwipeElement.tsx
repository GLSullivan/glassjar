import React, {
  ReactNode,
  useEffect,
  useRef,
  useCallback,
  useReducer,
  memo,
  FC,
} from 'react';
import './../css/SwipeElement.css';

interface SwipeElementProps {
  children: ReactNode;
  disabled?: boolean;
}

interface SwipeActionProps {
  action: () => void;
  children: ReactNode;
}

interface State {
  offset: number;
  activeIndex: number | null;
  actionWidths: number[];
}

type Action =
  | { type: 'SET_OFFSET'; payload: number }
  | { type: 'SET_ACTIVE_INDEX'; payload: number | null }
  | { type: 'SET_ACTION_WIDTHS'; payload: number[] };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_OFFSET':
      return { ...state, offset: action.payload };
    case 'SET_ACTIVE_INDEX':
      return { ...state, activeIndex: action.payload };
    case 'SET_ACTION_WIDTHS':
      return { ...state, actionWidths: action.payload };
    default:
      return state;
  }
};

const SwipeAction: FC<SwipeActionProps> = memo(({ action, children }) => {
  return (
    <div className="glassjar__swiper-elements__swipe-action" onClick={action}>
      {children}
    </div>
  );
});

const SwipeElement: FC<SwipeElementProps> & { Action: typeof SwipeAction } = ({
  children,
  disabled = false
}) => {
  const [state, dispatch] = useReducer(reducer, {
    offset: 0,
    activeIndex: null,
    actionWidths: [],
  });

  const { offset, activeIndex, actionWidths } = state;

  const touchStartX = useRef(0);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (actionsRef.current) {
      const children = actionsRef.current.childNodes as NodeListOf<HTMLElement>;
      let sum = 0;
      const widths = Array.from(children).map((child) => {
        sum += child.offsetWidth;
        return sum;
      });
      dispatch({ type: 'SET_ACTION_WIDTHS', payload: widths });
    }
  }, [children]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      const touchMoveX = e.touches[0].clientX;
      const diff = touchStartX.current - touchMoveX;
      dispatch({ type: 'SET_OFFSET', payload: diff });

      const activeIdx = actionWidths.findIndex((width) => diff < width);

      if (activeIdx === 0 && diff < actionWidths[0]) {
        dispatch({ type: 'SET_ACTIVE_INDEX', payload: null });
      } else if (activeIdx !== -1) {
        dispatch({ type: 'SET_ACTIVE_INDEX', payload: activeIdx - 1 });
      } else {
        dispatch({
          type: 'SET_ACTIVE_INDEX',
          payload: actionWidths.length - 1,
        });
      }
    },
    [actionWidths]
  );

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;

    // Determine the active index based on the offset and action widths
    const activeIndex = actionWidths.findIndex((width) => offset < width);
    const adjustedIndex =
      activeIndex === -1 ? actionWidths.length - 1 : activeIndex - 1;

    // Fire the appropriate action only if the offset exceeds the width of the first action
    if (offset >= actionWidths[0] && adjustedIndex >= 0 && actionsRef.current) {
      const children = actionsRef.current.childNodes as NodeListOf<HTMLElement>;
      if (children[adjustedIndex]) {
        const actionElement = children[adjustedIndex] as HTMLElement;
        actionElement.click();
      }
    }

    // Tween animation logic
    const startTime = Date.now();
    const startOffset = offset;
    const duration = 250; // 0.25 seconds

    const animate = () => {
      const currentTime = Date.now();
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const newOffset = startOffset + (0 - startOffset) * progress;
      dispatch({ type: 'SET_OFFSET', payload: newOffset });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    dispatch({ type: 'SET_ACTIVE_INDEX', payload: null });
    // eslint-disable-next-line
  }, [offset]);

  useEffect(() => {
    if (actionsRef.current) {
      const children = actionsRef.current.childNodes as NodeListOf<HTMLElement>;
      children.forEach((child, index) => {
        if (activeIndex === null) {
          child.classList.remove('active');
        } else {
          child.classList.toggle('active', index === activeIndex);
        }
      });
    }
  }, [activeIndex]);

  return (
    <div className="glassjar__swiper-elements">
      <div className="glassjar__swiper-elements__swipe-under" ref={actionsRef}>
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child) && child.type === SwipeAction) {
            return React.cloneElement(child, { key: `action-${index}` });
          }
          return null;
        })}
      </div>
      <div
        className="glassjar__swiper-elements__swipe-over"
        style={{ marginLeft: `-${offset}px` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child) && child.type !== SwipeAction) {
            return React.cloneElement(child, { key: `content-${index}` });
          }
          return null;
        })}
      </div>
    </div>
  );
};

SwipeElement.Action = SwipeAction;

export { SwipeElement };
