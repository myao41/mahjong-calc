import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: 480, margin: '60px auto', padding: 24, textAlign: 'center',
          fontFamily: '"Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
          <h2 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 12 }}>
            エラーが発生しました
          </h2>
          <p style={{ fontSize: 14, color: '#7f8c8d', lineHeight: 1.8, marginBottom: 20 }}>
            予期しないエラーが発生しました。<br />
            ページをリロードしてください。
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px', fontSize: 14, fontWeight: 'bold',
              background: '#3498db', color: '#fff', border: 'none',
              borderRadius: 6, cursor: 'pointer',
            }}
          >
            リロード
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
