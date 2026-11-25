import {expect,it} from '@jest/globals';
import {departures,frequencyRows,HOUR_SCALE} from '../src/services/officialTimetable';
it('preserves the five official lines, all day types and the summer bands',()=>{
 expect(frequencyRows).toHaveLength(15);
 for(const line of ['1','2','3','5','7'])expect(frequencyRows.filter((row)=>row.line===line).map((row)=>row.day)).toEqual(['Laborable','Sábado','Domingo']);
 for(const row of frequencyRows)for(const [start,end,value] of row.bands){expect(start).toBeGreaterThanOrEqual(HOUR_SCALE.start-.01);expect(end).toBeLessThanOrEqual(HOUR_SCALE.end);expect(end).toBeGreaterThan(start);expect(value).toMatch(/^\d+(–\d+)?$/);}
 expect(frequencyRows.filter((row)=>row.bands.some((band)=>band[3])).map((row)=>row.day)).toEqual(['Sábado','Domingo']);
});
it('preserves cabecera-specific first/last times and midnight service endings',()=>{
 expect(departures.find((line)=>line.line==='1')!.rows[0]).toEqual({days:'Lunes–sábado',from:'Plaza España',first:'06:40',last:'01:30'});
 expect(departures.find((line)=>line.line==='2')!.rows[2]).toEqual({days:'Domingos y festivos',from:'Plaza España',first:'09:00',last:'00:00'});
 expect(departures.find((line)=>line.line==='7')!.rows.at(-1)).toEqual({days:'Domingos y festivos',from:'Simón Bolívar',first:'09:20',last:'15:35'});
});
