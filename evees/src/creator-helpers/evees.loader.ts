import { RemoteEvees } from '../evees/interfaces/remote.evees';
import { EveesConfig } from '../evees/interfaces/types';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';
import { buildStore } from './build.store';
import { buildRecognizer } from './build.recognizer';
import { registerComponents } from './register.components';
import { buildEvees } from './build.evees';
import { CASRemote } from '../cas/interfaces/cas-remote';

/** a top level wrapper that registers everything */
export const eveesLoader = (
  remotes: Array<RemoteEvees>,
  stores: CASRemote[],
  modules: Map<string, EveesContentModule>,
  config?: EveesConfig
): void => {
  const store = buildStore(stores);
  const recognizer = buildRecognizer(modules);
  const evees = buildEvees(remotes, store, recognizer, config, modules);
  registerComponents(evees);
};