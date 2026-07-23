"use client";

import { personalGrowthGalaxyId } from "../../universe-destinations";

const descriptionId = "personal-growth-galaxy-description";

type PersonalGrowthGalaxyLabelProps = Readonly<{
  isEmphasized: boolean;
  isVisible: boolean;
  onActivate: () => void;
  onFocusChange: (isFocused: boolean) => void;
  onHoverChange: (isHovered: boolean) => void;
}>;

export function PersonalGrowthGalaxyLabel({
  isEmphasized,
  isVisible,
  onActivate,
  onFocusChange,
  onHoverChange,
}: PersonalGrowthGalaxyLabelProps) {
  return (
    <>
      <button
        aria-describedby={descriptionId}
        aria-hidden={!isVisible}
        className="university-galaxy-label personal-growth-galaxy-label"
        data-emphasized={isEmphasized}
        data-spatial-anchor={`galaxy:${personalGrowthGalaxyId}`}
        data-visible={isVisible}
        onBlur={() => onFocusChange(false)}
        onClick={onActivate}
        onFocus={() => onFocusChange(true)}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        tabIndex={isVisible ? 0 : -1}
        type="button"
      >
        Personal Growth
      </button>
      <span aria-hidden={!isVisible} className="sr-only" id={descriptionId}>
        Personal Growth galaxy. Activate to explore its development systems.
      </span>
    </>
  );
}
