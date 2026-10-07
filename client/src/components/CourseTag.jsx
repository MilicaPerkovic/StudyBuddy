export default function CourseTag({ name, color }) {
  if (!name) return <span className="tag muted">Brez predmeta</span>;
  return (
    <span className="tag" style={{ borderColor: color, color }}>
      {name}
    </span>
  );
}
