import './styles/main.css';
import './styles/report.css';
import { getSession } from './services/authService.js';
import { mountLogin } from './ui/login.js';
import { mountApp } from './ui/app.js';

async function boot() {
  const session = await getSession();
  if (session) mountApp(boot);
  else mountLogin(boot);
}

boot();