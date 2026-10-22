export default function AcademyBar({ user, onReturn }) {
  if (!user) return null
  return (
    <div className="academy-bar" role="banner">
      <div className="academy-user">
        <span className="academy-user-name">{user.name}</span>
        <span className="academy-user-email">{user.email}</span>
      </div>
      <button
        type="button"
        className="academy-return"
        onClick={onReturn}
        title="Tagasi Woodhouse Academy'sse"
      >
        ← Tagasi Academy'sse
      </button>
    </div>
  )
}
