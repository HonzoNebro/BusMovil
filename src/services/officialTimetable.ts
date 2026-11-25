// Frequency band positions preserve the official graphic's original hour scale.
// They are not inferred exact departure times. Source/provenance: assets/timetables/README.md.
export const OFFICIAL_TIMETABLE_URL =
  'https://institucional.cadiz.es/area/documento/plano-de-lineas';
export const HOUR_SCALE = { start: 293.531, end: 716.824, hours: 20 };
export type FrequencyBand = [number, number, string, boolean?];
export interface FrequencyRow {
  line: string;
  day: string;
  bands: FrequencyBand[];
}
const oneWeekend: FrequencyBand[] = [
  [299.181, 356.997, '10–20'],
  [356.753, 483.93, '8–10'],
  [483.213, 526.241, '10–15'],
  [525.883, 632.202, '8–12'],
  [632.018, 706.154, '12–22']
];
export const frequencyRows: FrequencyRow[] = [
  {
    line: '1',
    day: 'Laborable',
    bands: [
      [299.181, 323.884, '10–20'],
      [323.718, 483.93, '5–10'],
      [483.213, 526.241, '8–15'],
      [526.062, 632.381, '6–12'],
      [632.018, 706.154, '12–22']
    ]
  },
  { line: '1', day: 'Sábado', bands: oneWeekend },
  { line: '1', day: 'Domingo', bands: oneWeekend },
  {
    line: '2',
    day: 'Laborable',
    bands: [
      [293.531, 314.686, '30'],
      [314.778, 335.934, '20'],
      [335.842, 483.93, '10–15'],
      [483.213, 611.047, '10–16'],
      [610.863, 674.329, '15–20']
    ]
  },
  {
    line: '2',
    day: 'Sábado',
    bands: [
      [293.531, 314.686, '30'],
      [314.686, 346.171, '15–20'],
      [346.171, 610.863, '10–15'],
      [610.863, 674.329, '15–20']
    ]
  },
  {
    line: '2',
    day: 'Domingo',
    bands: [
      [346.171, 378.152, '15–20'],
      [378.152, 610.863, '10–15'],
      [610.864, 674.513, '15–20']
    ]
  },
  {
    line: '3',
    day: 'Laborable',
    bands: [
      [293.53, 336.025, '20'],
      [335.842, 483.93, '8–17'],
      [483.213, 525.883, '15–22'],
      [526.245, 610.863, '10–17'],
      [610.863, 680.956, '15–20']
    ]
  },
  {
    line: '3',
    day: 'Sábado',
    bands: [
      [293.531, 314.87, '20'],
      [314.87, 680.956, '15–22']
    ]
  },
  { line: '3', day: 'Domingo', bands: [[328.556, 680.956, '15–22']] },
  {
    line: '5',
    day: 'Laborable',
    bands: [
      [293.53, 336.025, '10–20'],
      [335.842, 483.93, '8–15'],
      [483.213, 632.019, '10–15'],
      [632.019, 684.999, '15–25']
    ]
  },
  {
    line: '5',
    day: 'Sábado',
    bands: [
      [293.531, 356.997, '20'],
      [356.753, 483.754, '10–15'],
      [484.08, 526.425, '10–20'],
      [526.407, 684.999, '10–17']
    ]
  },
  {
    line: '5',
    day: 'Domingo',
    bands: [
      [299.181, 378.152, '20'],
      [378.152, 684.999, '10–17']
    ]
  },
  {
    line: '7',
    day: 'Laborable',
    bands: [
      [314.686, 341.367, '12–20'],
      [341.368, 632.019, '10–16']
    ]
  },
  {
    line: '7',
    day: 'Sábado',
    bands: [
      [356.752, 497.828, '15–25'],
      [498.086, 653.889, '15–25', true]
    ]
  },
  {
    line: '7',
    day: 'Domingo',
    bands: [
      [357.009, 497.828, '15–25'],
      [498.086, 653.889, '15–25', true]
    ]
  }
];
export interface DepartureRow {
  days: string;
  from: string;
  first: string;
  last: string;
}
export const departures: Array<{ line: string; rows: DepartureRow[] }> = [
  {
    line: '1',
    rows: [
      {
        days: 'Lunes–sábado',
        from: 'Plaza España',
        first: '06:40',
        last: '01:30'
      },
      {
        days: 'Lunes–sábado',
        from: 'Cortadura',
        first: '06:20',
        last: '01:10'
      },
      {
        days: 'Domingos y festivos',
        from: 'Plaza España',
        first: '06:40',
        last: '01:30'
      },
      {
        days: 'Domingos y festivos',
        from: 'Cortadura',
        first: '06:20',
        last: '01:10'
      }
    ]
  },
  {
    line: '2',
    rows: [
      {
        days: 'Lunes–sábado',
        from: 'Plaza España',
        first: '06:00',
        last: '00:00'
      },
      {
        days: 'Lunes–sábado',
        from: 'Barriada Loreto',
        first: '06:00',
        last: '23:30'
      },
      {
        days: 'Domingos y festivos',
        from: 'Plaza España',
        first: '09:00',
        last: '00:00'
      },
      {
        days: 'Domingos y festivos',
        from: 'Barriada Loreto',
        first: '08:30',
        last: '23:30'
      }
    ]
  },
  {
    line: '3',
    rows: [
      {
        days: 'Lunes–sábado',
        from: 'Plaza España',
        first: '06:20',
        last: '00:20'
      },
      { days: 'Lunes–sábado', from: 'Puntales', first: '06:00', last: '00:00' },
      {
        days: 'Domingos y festivos',
        from: 'Plaza España',
        first: '08:00',
        last: '00:20'
      },
      {
        days: 'Domingos y festivos',
        from: 'Puntales',
        first: '07:40',
        last: '00:00'
      }
    ]
  },
  {
    line: '5',
    rows: [
      {
        days: 'Lunes–sábado',
        from: 'Plaza España',
        first: '06:00',
        last: '00:30'
      },
      {
        days: 'Lunes–sábado',
        from: 'Zona Franca',
        first: '06:00',
        last: '00:10'
      },
      {
        days: 'Domingos y festivos',
        from: 'Plaza España',
        first: '06:40',
        last: '00:30'
      },
      {
        days: 'Domingos y festivos',
        from: 'Zona Franca',
        first: '06:20',
        last: '00:10'
      }
    ]
  },
  {
    line: '7',
    rows: [
      {
        days: 'Lunes–viernes',
        from: 'Gta. Ing. La Cierva',
        first: '07:00',
        last: '21:40'
      },
      {
        days: 'Lunes–viernes',
        from: 'Simón Bolívar',
        first: '07:20',
        last: '22:05'
      },
      {
        days: 'Sábados',
        from: 'Gta. Ing. La Cierva',
        first: '09:00',
        last: '15:10'
      },
      { days: 'Sábados', from: 'Simón Bolívar', first: '09:20', last: '15:35' },
      {
        days: 'Domingos y festivos',
        from: 'Gta. Ing. La Cierva',
        first: '09:00',
        last: '15:10'
      },
      {
        days: 'Domingos y festivos',
        from: 'Simón Bolívar',
        first: '09:20',
        last: '15:35'
      }
    ]
  }
];
