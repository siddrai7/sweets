'use client';

/** Last-resort fallback if the root layout itself fails. Kept dependency-free on purpose. */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en-IN">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          background: '#faf6ef',
          color: '#1f1612',
          textAlign: 'center',
          padding: '80px 16px',
        }}
      >
        <h1 style={{ fontWeight: 300 }}>Something went wrong</h1>
        <p>Please try again in a moment.</p>
        <button
          onClick={reset}
          style={{
            marginTop: 16,
            padding: '12px 24px',
            borderRadius: 999,
            border: 0,
            background: '#7d1b28',
            color: '#fff',
            fontSize: 16,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
