export function PageLoader({ text = "Loading..." }) {
  return (
    <div className="page-loader active">
      <div className="spinner" />
      <p className="loader-text">{text}</p>
    </div>
  );
}

export function ButtonSpinner({ dark = false }) {
  return <span className={`btn-spinner ${dark ? "dark" : ""}`} />;
}
