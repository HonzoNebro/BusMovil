import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { it, expect } from '@jest/globals';
import {
  LanguageProvider,
  useLanguage,
  deviceLanguage
} from '../src/i18n/Language';
import { OfficialTimetable } from '../src/components/StopMap/OfficialTimetable';
import { englishTranslations, translate } from '../src/i18n/strings';
import { extraTranslations } from '../src/i18n/extra';
import { frequencyRows, departures } from '../src/services/officialTimetable';

it('covers every registered English message in French and Portuguese', () => {
  for (const language of ['fr', 'pt'] as const) {
    expect(
      Object.keys(englishTranslations).filter(
        (key) => !extraTranslations[language][key]
      )
    ).toEqual([]);
    expect(translate('A Plaza España', language)).toBe(
      language === 'fr' ? 'Vers Plaza España' : 'Para Plaza España'
    );
    expect(translate('República Argentina', language)).toBe(
      'República Argentina'
    );
  }
});
it('translates every day label in the actual timetable dataset', () => {
  const days = [
    ...frequencyRows.map((row) => row.day),
    ...departures.flatMap((line) => line.rows.map((row) => row.days))
  ];
  for (const source of new Set(days)) {
    expect(translate(source, 'en')).not.toBe(source);
    expect(translate(source, 'fr')).not.toBe(source);
  }
});
it('selects French and Portuguese by phone locale without changing unsupported-language fallback', () => {
  expect(deviceLanguage('fr_CA')).toBe('fr');
  expect(deviceLanguage('pt-BR')).toBe('pt');
  expect(deviceLanguage('es-ES')).toBe('es');
  expect(deviceLanguage('de-DE')).toBe('en');
});
it('renders English departures and frequencies with translated headings, days and summer note', async () => {
  let context!: ReturnType<typeof useLanguage>;
  function Page({ section }: { section: 'departures' | 'frequencies' }) {
    context = useLanguage();
    return (
      <OfficialTimetable
        visible
        singleSection
        initialSection={section}
        returnLabel="Volver a Información y opciones"
        onClose={() => undefined}
      />
    );
  }
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <LanguageProvider>
        <Page section="departures" />
      </LanguageProvider>
    );
  });
  await act(async () => {
    await context.setChoice('en');
  });
  let text = JSON.stringify(tree.toJSON());
  expect(text).toContain('Monday–Saturday');
  expect(text).toContain('Monday–Friday');
  expect(text).toContain('summer Saturdays and Sundays');
  expect(text).toContain('in Spanish');
  expect(text).not.toContain('periodo estival');
  expect(text).not.toContain('"Desde"');
  await act(async () => {
    tree.update(
      <LanguageProvider>
        <Page section="frequencies" />
      </LanguageProvider>
    );
  });
  text = JSON.stringify(tree.toJSON());
  expect(text).toContain('Weekday');
  expect(text).toContain('Saturday');
  expect(text).not.toContain('"Laborable"');
  await act(async () => {
    await context.setChoice('system');
  });
  act(() => tree.unmount());
});
