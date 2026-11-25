import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { AppState, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
export type Language = 'es' | 'en' | 'fr' | 'pt';
export const languageNames = {
  system: 'Seguir el teléfono',
  es: 'Español',
  en: 'English',
  fr: 'Français',
  pt: 'Português'
} as const;
export const locales = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', pt: 'pt-PT' };
export function deviceLanguage(value: string): Language {
  const prefix = value.toLowerCase().split(/[-_]/)[0];
  return prefix === 'es' || prefix === 'fr' || prefix === 'pt' ? prefix : 'en';
}
export type LanguageChoice = Language | 'system';
const KEY = 'busmovil.language.v1';
function device(): Language {
  const value =
    NativeModules.TransitNfc?.deviceLanguage ??
    NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ??
    NativeModules.I18nManager?.localeIdentifier ??
    'es';
  return deviceLanguage(String(value));
}
const Context = createContext({
  language: 'es' as Language,
  locale: 'es-ES',
  choice: 'system' as LanguageChoice,
  setChoice: (() => Promise.resolve()) as (
    choice: LanguageChoice
  ) => Promise<void>,
  error: undefined as string | undefined
});
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [choice, setValue] = useState<LanguageChoice>('system');
  const [system, setSystem] = useState(device);
  const [error, setError] = useState<string>();
  const version = useRef(0);
  const saveQueue = useRef(Promise.resolve());
  useEffect(() => {
    let live = true;
    const initial = version.current;
    void AsyncStorage.getItem(KEY)
      .then((value) => {
        if (
          live &&
          version.current === initial &&
          (value === 'es' ||
            value === 'en' ||
            value === 'fr' ||
            value === 'pt' ||
            value === 'system')
        )
          setValue(value);
      })
      .catch(() => {
        if (live) setError('No se pudo recuperar el idioma.');
      });
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setSystem(device());
        void NativeModules.TransitNfc?.getDeviceLocale?.()
          ?.then((v: string) => {
            if (live) setSystem(deviceLanguage(v));
          })
          .catch(() => undefined);
      }
    });
    return () => {
      live = false;
      sub?.remove();
    };
  }, []);
  const setChoice = async (value: LanguageChoice) => {
    ++version.current;
    setValue(value);
    setError(undefined);
    saveQueue.current = saveQueue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(KEY, value));
    try {
      await saveQueue.current;
    } catch {
      setError('No se pudo guardar el idioma.');
    }
  };
  const language = choice === 'system' ? system : choice;
  return (
    <Context.Provider
      value={{
        language,
        locale: locales[language],
        choice,
        setChoice,
        error
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useLanguage = () => useContext(Context);
