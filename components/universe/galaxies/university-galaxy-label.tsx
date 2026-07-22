"use client";

import { universityGalaxyDefinition } from "./university-galaxy-definition";

const descriptionId = "university-galaxy-description";

type UniversityGalaxyLabelProps = Readonly<{
  isEmphasized: boolean;
  isVisible: boolean;
  onActivate: () => void;
  onFocusChange: (isFocused: boolean) => void;
  onHoverChange: (isHovered: boolean) => void;
}>;

export function UniversityGalaxyLabel({
  isEmphasized,
  isVisible,
  onActivate,
  onFocusChange,
  onHoverChange,
}: UniversityGalaxyLabelProps) {
  return (
    <>
      <button
        aria-describedby={descriptionId}
        aria-hidden={!isVisible}
        className="university-galaxy-label"
        data-emphasized={isEmphasized}
        data-visible={isVisible}
        onBlur={() => onFocusChange(false)}
        onClick={onActivate}
        onFocus={() => onFocusChange(true)}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        tabIndex={isVisible ? 0 : -1}
        type="button"
      >
        {universityGalaxyDefinition.name}
      </button>
      <span aria-hidden={!isVisible} className="sr-only" id={descriptionId}>
        University galaxy. Activate to explore its course systems.
      </span>
    </>
  );
}
