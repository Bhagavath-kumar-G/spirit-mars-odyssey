import { Component, type ReactNode } from "react";

/** Keeps the story readable if WebGL fails on a device. */
export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.error("3D scene failed", error);
  }

  override render() {
    if (this.state.failed) {
      return (
        <div className="fixed inset-0 z-0 bg-veil opacity-40">
          <p className="hud-label absolute bottom-4 left-4">3D view unavailable on this device</p>
        </div>
      );
    }
    return this.props.children;
  }
}
