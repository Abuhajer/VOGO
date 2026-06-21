"use client";

import { Component, type ReactNode } from "react";
import FittingRoomErrorFallback from "./FittingRoomErrorFallback";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class FittingRoomErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[fitting-room] client render failed", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <FittingRoomErrorFallback onRetry={() => this.setState({ hasError: false })} />
      );
    }

    return this.props.children;
  }
}
