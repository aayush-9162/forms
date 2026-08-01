function FormRow({ children, cols }) {
  const grid =
    cols === 3
      ? 'grid grid-cols-1 sm:grid-cols-3 gap-x-4'
      : 'grid grid-cols-1 sm:grid-cols-2 gap-x-4'
  return <div className={grid}>{children}</div>
}

export default FormRow
