import React from "react";

type Props = {
    feature?: string;
    children: React.ReactNode;
};

type State = {
    hasError: boolean;
    error?: Error;
};

export class FeatureErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Keep this lean so the boundary itself never crashes.
        console.error(`[FeatureErrorBoundary] ${this.props.feature ?? "unknown"}`, error, info);
    }

    private reload = () => window.location.reload();

    render() {
        if (!this.state.hasError) return this.props.children;

        // Minimal fallback UI (don’t depend on fancy app components).
        return (
            <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
                <div
                    style={{
                        width: "min(720px, 92vw)",
                        borderRadius: 16,
                        padding: 20,
                        border: "1px solid rgba(255,255,255,0.12)",
                    }}
                >
                    <h2 style={{ margin: 0, fontSize: 22 }}>Something went wrong</h2>
                    <p style={{ opacity: 0.8 }}>
                        The application encountered an unexpected error. Your data should be safe.
                    </p>

                    <pre style={{ overflow: "auto", opacity: 0.85, fontSize: 12 }}>
                        {String(this.state.error?.message ?? "Unknown error")}
                    </pre>

                    <button
                        onClick={this.reload}
                        style={{
                            marginTop: 12,
                            padding: "10px 14px",
                            borderRadius: 10,
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        Reload Application
                    </button>
                </div>
            </div>
        );
    }
}
