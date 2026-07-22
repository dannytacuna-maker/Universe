"use client";

import { beerusPlanetDefinition } from "./beerus-planet-definition";

type BeerusPlanetLabelProps = Readonly<{
  isEmphasized: boolean;
  isVisible: boolean;
  onActivate: () => void;
  onFocusChange: (isFocused: boolean) => void;
  onHoverChange: (isHovered: boolean) => void;
}>;

export function BeerusPlanetLabel({
  isEmphasized,
  isVisible,
  onActivate,
  onFocusChange,
  onHoverChange,
}: BeerusPlanetLabelProps) {
  return (
    <button
      aria-describedby="beerus-planet-description"
      aria-hidden={!isVisible}
      className="beerus-planet-label"
      data-emphasized={isEmphasized}
      data-visible={isVisible}
      onBlur={() => onFocusChange(false)}
      onClick={onActivate}
      onFocus={() => onFocusChange(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate();
        }
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      tabIndex={isVisible ? 0 : -1}
      type="button"
    >
      <span>{beerusPlanetDefinition.name}</span>
      <small aria-hidden="true">Land</small>
      <span className="sr-only" id="beerus-planet-description">
        {beerusPlanetDefinition.description} Activate to land on the planet.
      </span>
    </button>
  );
}
