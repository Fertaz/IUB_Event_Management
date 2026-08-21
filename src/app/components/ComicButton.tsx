import React from "react";
import { Link } from "react-router";

type CommonProps = {
  children: React.ReactNode;
  /** Background color of the inner panel. Defaults to the comic red. */
  innerColor?: string;
  /** Extra classes on the outer container. */
  className?: string;
  ariaLabel?: string;
};

type LinkProps = CommonProps & {
  to: string;
  type?: never;
  onClick?: never;
  disabled?: never;
};

type ButtonProps = CommonProps & {
  to?: never;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
};

type ComicButtonProps = LinkProps | ButtonProps;

function ComicInner({
  children,
  innerColor,
}: {
  children: React.ReactNode;
  innerColor?: string;
}) {
  return (
    <span
      className="button-inner"
      style={innerColor ? { backgroundColor: innerColor } : undefined}
    >
      <span className="halftone-overlay" />
      <span className="ink-splatter" />
      <span className="button-text">{children}</span>
    </span>
  );
}

export function ComicButton(props: ComicButtonProps) {
  const { children, innerColor, className, ariaLabel } = props;
  const containerClass = ["comic-brutal-button-container", className]
    .filter(Boolean)
    .join(" ");

  if ("to" in props && props.to !== undefined) {
    return (
      <Link to={props.to} className={containerClass} aria-label={ariaLabel}>
        <span className="comic-brutal-button">
          <span className="button-shadow" />
          <span className="button-frame" />
          <ComicInner innerColor={innerColor}>{children}</ComicInner>
        </span>
      </Link>
    );
  }

  const { type = "button", onClick, disabled } = props as ButtonProps;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="comic-brutal-button"
      style={{
        ...(disabled ? { opacity: 0.5, pointerEvents: "none" } : {}),
        margin: "0.5em",
      }}
    >
      <span className="button-shadow" />
      <span className="button-frame" />
      <ComicInner innerColor={innerColor}>{children}</ComicInner>
    </button>
  );
}
