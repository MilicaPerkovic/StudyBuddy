/** Shows loading / error state; renders children when ready. */
export default function Status({ loading, error, children }) {
  if (error)
    return (
      <p className="error" role="alert">
        {error}
      </p>
    );
  if (loading) return <p className="muted">Nalaganje…</p>;
  return children;
}
