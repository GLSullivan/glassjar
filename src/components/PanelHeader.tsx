import React from "react";
import "./../css/PanelHeader.css";

interface HeaderProps {
  title                  : string;
  onPrimaryAction       ?: () => void;
  primaryActionLabel    ?: string;
  showPrimaryButton     ?: boolean;
  disablePrimaryButton  ?: boolean;
  onSecondaryAction     ?: () => void;
  secondaryActionLabel  ?: string;
  showSecondaryButton   ?: boolean;
  disableSecondaryButton?: boolean;
};

const PanelHeader: React.FC<HeaderProps> = ({
  title,
  onPrimaryAction,
  primaryActionLabel     = "Save",
  showPrimaryButton      = true,
  disablePrimaryButton   = false,
  onSecondaryAction,
  secondaryActionLabel   = "Cancel",
  showSecondaryButton    = true,
  disableSecondaryButton = false
}) => {
  return (
    <div className="glassjar__panel-header">
      <button 
        className={`glassjar__text-button ${showSecondaryButton ? "" : "glassjar__text-button--hidden"}`} 
        onClick={onSecondaryAction} 
        disabled={disableSecondaryButton || !showSecondaryButton}
      >
        {secondaryActionLabel}
      </button>
      <h1>{title}</h1>
      <button 
        className={`glassjar__text-button glassjar__text-button--primary ${showPrimaryButton ? "" : "glassjar__text-button--hidden"}`} 
        onClick={onPrimaryAction} 
        disabled={disablePrimaryButton || !showPrimaryButton}
      >
        {primaryActionLabel}
      </button>
    </div>
  );
};

export default PanelHeader;
