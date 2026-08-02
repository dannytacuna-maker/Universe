"use client";

import { forgeGalaxyId } from "../../universe-destinations";

const descriptionId = "forge-galaxy-description";

type ForgeGalaxyLabelProps = Readonly<{
  isEmphasized: boolean;
  isVisible: boolean;
  onActivate: () => void;
  onFocusChange: (isFocused: boolean) => void;
  onHoverChange: (isHovered: boolean) => void;
}>;

export function ForgeGalaxyLabel({
  isEmphasized,
  isVisible,
  onActivate,
  onFocusChange,
  onHoverChange,
}: ForgeGalaxyLabelProps) {
  return (
    <>
      <button
        aria-describedby={descriptionId}
        aria-hidden={!isVisible}
        className="university-galaxy-label forge-galaxy-label"
        data-emphasized={isEmphasized}
        data-spatial-anchor={`galaxy:${forgeGalaxyId}`}
        data-visible={isVisible}
        onBlur={() => onFocusChange(false)}
        onClick={onActivate}
        onFocus={() => onFocusChange(true)}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        tabIndex={isVisible ? 0 : -1}
        type="button"
      >
        The Forge
      </button>
      <span aria-hidden={!isVisible} className="sr-only" id={descriptionId}>
        The Forge galaxy. Activate to explore venture and project systems.
      </span>
    </>
  );
}
