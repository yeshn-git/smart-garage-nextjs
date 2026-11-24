import Logo from "./Logo";

export default function AuthSide({ title, text, points }) {
  return (
    <aside className="auth-side">
      <Logo />
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
        <ul className="auth-points">
          {points.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </div>
      <p className="small">© SmartGarage AI</p>
    </aside>
  );
}
