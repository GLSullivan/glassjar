import React from "react";

import { colorPalette } from "./../data/ColorPalette";

import "./../css/ColorPicker.css";

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
    <div className="color-picker">
      {colorPalette.map((color, index) => (
        <button
          key={index}
          className={`color-picker__color${
            index === selectedIndex ? " color-picker__color--selected" : ""
          }`}
          style={{ backgroundColor: color }}
          onClick={(event) => handleColorSelect(event, index)}
          type="button"
        ></button>
      ))}
    </div>
  );
};

export default ColorPicker;
