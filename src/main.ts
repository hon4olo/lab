import './styles.css';
import { startApplication } from './app/startApplication';

void startApplication().catch((error: unknown) => {
  console.error('Snack Lab failed to start', error);
  const status = document.querySelector<HTMLElement>('#boot-status');
  if (status) status.textContent = 'Unable to start. Please reload.';
});
