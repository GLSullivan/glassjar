import React from "react";

import './../css/ColorPicker.css'

interface ColorPickerProps {
  onSelect: (color: string) => void;
  selectedColor: string; 
}

const colorPalette = [
  "#F0F5F3",
  "#CFD8DC",
  "#A8DADC",
  "#A7C4B5",
  "#A8C1B4",
  "#A9C9A4",
  "#9FA9A3",
  "#54816F",
  "#6C8572",
  "#7B9A98",
  "#8B7C6D",
  "#B7A797",
  "#D19F84",
  "#C1A4A4",
  "#CBA3A3",
  "#B8A7A6",
];

const ColorPicker: React.FC<ColorPickerProps> = ({ onSelect, selectedColor }) => {
  const handleColorSelect = (event: React.MouseEvent, color: string) => {
    event.stopPropagation(); 
    onSelect(color);
  };

  return (
    <div className="color-picker">
      {colorPalette.map((color, index) => (
        <button
          key={index}
          className={`color-picker__color${color.toLowerCase() === selectedColor.toLowerCase() ? " color-picker__color--selected" : ""}`} // Convert both colors to lowercase when comparing
          style={{ backgroundColor: color }}
          onClick={(event) => handleColorSelect(event, color)}
          type="button"
        ></button>
      ))}
    </div>
  );
};

export default ColorPicker;