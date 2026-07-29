"use client";

import { globalObservatoryDefinition } from "./observatory-definition";
import styles from "./observatory-label.module.css";

type ObservatoryLabelProps = Readonly<{
  isEmphasized: boolean;
  isVisible: boolean;
  onActivate: () => void;
  onFocusChange: (isFocused: boolean) => void;
  onHoverChange: (isHovered: boolean) => void;
}>;

export function ObservatoryLabel({
  isEmphasized,
  isVisible,
  onActivate,
  onFocusChange,
  onHoverChange,
}: ObservatoryLabelProps) {
  const descriptionId = `${globalObservatoryDefinition.id}-description`;

  return (
    <button
      aria-describedby={descriptionId}
      aria-hidden={!isVisible}
      className={`course-system-label ${styles.label}`}
      data-emphasized={isEmphasized}
      data-spatial-anchor={`planet:${globalObservatoryDefinition.id}`}
      data-status="explorable"
      data-visible={isVisible}
      onBlur={() => onFocusChange(false)}
      onClick={onActivate}
      onFocus={() => onFocusChange(true)}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      tabIndex={isVisible ? 0 : -1}
      type="button"
    >
      <span className="course-system-label__name">
        {globalObservatoryDefinition.name}
      </span>
      <span aria-hidden="true" className="course-system-label__preview">
        Weekly world intelligence
      </span>
      <span className="sr-only" id={descriptionId}>
        {globalObservatoryDefinition.description} Activate to enter the station.
      </span>
    </button>
  );
}
