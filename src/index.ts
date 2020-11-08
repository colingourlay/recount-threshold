import { DECOY_KEYS, requestDOMPermit } from '@abcnews/env-utils';
import { selectMounts } from '@abcnews/mount-utils';
import './global.css';
import App from './components/App/App.svelte';

requestDOMPermit(DECOY_KEYS.PAGE).then(() => {
  const root = selectMounts('rtapp')[0];

  if (root) {
    new App({
      target: root,
      props: {}
    });
  }
});
