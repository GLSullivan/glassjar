import React from 'react';

import { accountColors } from '../data/AccountColors';

import './../css/ColorPicker.css';

interface ColorPickerProps {
  onSelect: (selectedIndex: number) => void;
  selectedIndex: number;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  onSelect,
  selectedIndex,
}) => {
  const handleColorSelect = (event: React.MouseEvent, index: number) => {
    event.stopPropagation();
    onSelect(index);
  };

  return (
    <div className='glassjar__color-picker'>
      {accountColors.map((color, index) => (
        <button
          key={index}
          className={`glassjar__color-picker__color${
            index === selectedIndex ? ' glassjar__color-picker__color--selected' : ''
          }`}
          style={{ background: color }}
          onClick={(event) => handleColorSelect(event, index)}
          type='button'
        ></button>
      ))}
    </div>
  );
};

export default ColorPicker;
