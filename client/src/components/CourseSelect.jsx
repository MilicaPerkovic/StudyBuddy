/** <select> of the user's courses. `allowEmpty` adds a "none"/"all" option. */
export default function CourseSelect({
  courses,
  value,
  onChange,
  allowEmpty,
  emptyLabel = '—',
  ...rest
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      {...rest}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {courses.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
