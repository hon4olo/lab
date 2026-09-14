import './styles.css';
import { createTranslator } from './localization/createTranslator';
import { resolveLocale } from './localization/resolveLocale';
import { startApplication } from './app/startApplication';

void startApplication().catch((error: unknown) => {
  console.error('Snack Lab failed to start', error);
  const status = document.querySelector<HTMLElement>('#boot-status');
  if (status) {
    const locale = resolveLocale(null, navigator.language);
    status.textContent = createTranslator(locale)('shell.failed');
  }
});
