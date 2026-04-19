export default function AffiliateCard({ icon, title, description, cta, href, tag }) {
  return (
    <a className="affiliate-card" href={href} target="_blank" rel="noopener noreferrer sponsored">
      {tag && <span className="affiliate-tag">{tag}</span>}
      <div className="affiliate-icon">{icon}</div>
      <div className="affiliate-body">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <span className="affiliate-cta">{cta} →</span>
    </a>
  );
}
