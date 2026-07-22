"use client";

import { Component, type ReactNode } from "react";

type WebGLBoundaryProps = Readonly<{
  children: ReactNode;
}>;

type WebGLBoundaryState = {
  hasFailed: boolean;
};

export class WebGLBoundary extends Component<
  WebGLBoundaryProps,
  WebGLBoundaryState
> {
  public override state: WebGLBoundaryState = {
    hasFailed: false,
  };

  public static getDerivedStateFromError(): WebGLBoundaryState {
    return { hasFailed: true };
  }

  public override render() {
    return this.state.hasFailed ? null : this.props.children;
  }
}
