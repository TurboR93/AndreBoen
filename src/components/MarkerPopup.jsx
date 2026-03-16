export default function MarkerPopup({ point }) {
  return (
    <div className="marker-popup">
      <h3 className="marker-popup__company">{point.company}</h3>
      <div className="marker-popup__divider" />
      <div className="marker-popup__detail">
        <span className="marker-popup__label">Nome:</span>
        <span>{point.firstName} {point.lastName}</span>
      </div>
      <div className="marker-popup__detail">
        <span className="marker-popup__label">Ruolo:</span>
        <span>{point.role}</span>
      </div>
      <div className="marker-popup__detail">
        <span className="marker-popup__label">Tel:</span>
        <span>{point.phone}</span>
      </div>
      <div className="marker-popup__detail">
        <span className="marker-popup__label">Email:</span>
        <span>{point.email}</span>
      </div>
      {point.city && (
        <div className="marker-popup__detail">
          <span className="marker-popup__label">Città:</span>
          <span>{point.city}</span>
        </div>
      )}
      {point.country && (
        <div className="marker-popup__detail">
          <span className="marker-popup__label">Paese:</span>
          <span>{point.country}</span>
        </div>
      )}
      {point.source === 'client-form' && (
        <div className="marker-popup__badge">Nuovo contatto</div>
      )}
    </div>
  )
}
