import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="auth-wrap">
      <section className="panel auth-panel">
        <h1>404</h1>
        <p>Page not found</p>
        <Link className="btn" to="/">Back to app</Link>
      </section>
    </div>
  );
}

export default NotFoundPage;
