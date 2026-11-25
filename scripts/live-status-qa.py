#!/usr/bin/env python3
"""Acceptance for startup GPS, persistent actions, route reveal and automatic network recovery."""
import importlib.util,json,re,subprocess,time
from pathlib import Path
spec=importlib.util.spec_from_file_location('mapqa',Path(__file__).with_name('map-qa.py'))
q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=q.ROOT/'docs/qa/2026-10-29-barra-y-actualizacion';q.OUT.mkdir(parents=True,exist_ok=True)
results={}
def dump():return q.tree()
def text(t=None):return '\n'.join(n.get('text','') for n in (t if t is not None else dump()).iter('node'))
def top():
 for _ in range(3):q.adb('shell','input','swipe',540,600,540,1900,300)
 time.sleep(.5)
def status(t=None):
 nodes=[n for n in (t if t is not None else dump()).iter('node') if n.get('content-desc')=='Actualizar llegadas']
 return '\n'.join(n.get('text','') for n in nodes[0].iter('node')) if nodes else ''
def wait_status(predicate,timeout=85):
 deadline=time.monotonic()+timeout
 while time.monotonic()<deadline:
  t=dump();value=status(t)
  if predicate(value):return value
  time.sleep(1)
 raise AssertionError('No llega el estado esperado: '+value)
def field(t,id):return next((n for n in t.iter('node') if n.get('resource-id','').split('/')[-1]==id),None)
def bar_visible(t):
 for label in ['Usar mi ubicación','Ver mapa de paradas','Horarios y frecuencias']:
  node=next(n for n in t.iter('node') if n.get('content-desc')==label)
  b=list(map(int,re.findall(r'\d+',node.get('bounds'))));assert b[3]>b[1] and b[3]<=2337,(label,b)
if __name__=='__main__':
 initial={key:q.adb('shell','settings','get','global',key) for key in ['wifi_on','mobile_data']}
 try:
  q.adb('shell','svc','wifi','enable');q.adb('shell','svc','data','enable')
  subprocess.run(['node','scripts/android-emulator.cjs','gps','1123'],cwd=q.ROOT,check=True,capture_output=True)
  q.adb('shell','am','force-stop',q.APP);q.adb('shell','am','start','-n',q.APP+'/app.transportescadiz.MainActivity');time.sleep(4)
  top();t=dump()
  assert 'Avenida de Andalucía (Vuelta)' in text(t),text(t)
  assert 'Sugerida automáticamente por proximidad' in text(t)
  wait_status(lambda v:'En directo' in v or 'Sin llegadas' in v)
  bar_visible(dump());q.shot('inicio-1123');results['startupGPS1123']='PASS'
  q.tap('Ver línea 7 en esta parada');q.tap('Ver todas las paradas');time.sleep(1)
  t=dump();node=field(t,'selected-route-stop');assert node is not None,'Parada seleccionada fuera de pantalla'
  b=list(map(int,re.findall(r'\d+',node.get('bounds'))));assert b[3]>b[1] and 63<=b[1]<2150,b
  bar_visible(t);q.shot('recorrido-parada-visible');results['routeRevealAndDock']='PASS'
  top();wait_status(lambda v:'En directo' in v or 'Sin llegadas' in v)
  q.adb('shell','svc','wifi','disable');q.adb('shell','svc','data','disable');time.sleep(2)
  q.tap('Actualizar llegadas');wait_status(lambda v:'Sin actualizar' in v,30)
  assert 'Dato anterior:' in text();q.shot('error-naranja');results['historicalErrorStatus']='PASS'
  q.adb('shell','svc','wifi','enable');q.adb('shell','svc','data','enable')
  # No refresh button or pull gesture after reconnecting: only the existing minute timer.
  recovered=wait_status(lambda v:'En directo' in v or 'Sin llegadas' in v,85)
  q.shot('recuperacion-automatica');results['automaticRecoveryWithoutInteraction']=recovered.strip()
  q.tap('Horarios y frecuencias');q.shot('tabla-nativa-frecuencias')
  q.tap('Primeras y últimas salidas');q.shot('tabla-nativa-salidas')
  q.tap('Volver a Líneas y llegadas');results['nativeTimetables']='PASS'
  (q.OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(results,flush=True)
 finally:
  for key,service in [('wifi_on','wifi'),('mobile_data','data')]:q.adb('shell','svc',service,'enable' if initial[key]=='1' else 'disable')
  subprocess.run(['node','scripts/android-emulator.cjs','gps-stop'],cwd=q.ROOT,check=True,capture_output=True)
  (q.OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
