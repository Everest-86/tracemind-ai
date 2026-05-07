function SectionHeading({ eyebrow, title, copy }) {
  return (
    <div className="section-heading">
      <div className="eyebrow section-eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  )
}

export default SectionHeading
