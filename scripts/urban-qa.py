#!/usr/bin/env python3
"""Native smoke and visual evidence for the Urbano design; emulator only."""
import json,re,subprocess,sys,time,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/qa/2026-10-29-urbano';OUT.mkdir(parents=True,exist_ok=True)
ADB=str(Path.home()/'Android/Sdk/platform-tools/adb');APP='app.transportescadiz'
results=[]
def adb(*args,binary=False):
    p=subprocess.run([ADB,'-s','emulator-5554',*map(str,args)],capture_output=True,check=True,timeout=30)
    return p.stdout if binary else p.stdout.decode().strip()
def tree():
    adb('shell','uiautomator','dump','/sdcard/urban.xml')
    return ET.fromstring(adb('shell','cat','/sdcard/urban.xml'))
def values():
    return '\n'.join(n.get('text','')+' '+n.get('content-desc','') for n in tree().iter('node'))
def tap(label):
    for attempt in range(7):
        t=tree()
        for n in t.iter('node'):
            if label in [n.get('text'),n.get('content-desc')]:
                a=list(map(int,re.findall(r'\d+',n.get('bounds',''))))
                if len(a)==4 and a[2]>a[0] and a[3]>a[1]:
                    adb('shell','input','tap',(a[0]+a[2])//2,(a[1]+a[3])//2);time.sleep(.4);return
        adb('shell','input','swipe',540,1800,540,700,300)
    raise AssertionError('No aparece '+label)
def launch():
    adb('shell','am','force-stop',APP);adb('shell','am','start','-n',APP+'/app.transportescadiz.MainActivity');time.sleep(3)
def shot(name):
    (OUT/(name+'.png')).write_bytes(adb('exec-out','screencap','-p',binary=True))
def case(name,fn):
    if len(sys.argv)>1 and name not in sys.argv[1:]: return
    try:
        fn();shot(name);results.append({'case':name,'status':'PASS'})
    except Exception as e:
        shot(name);results.append({'case':name,'status':'FAIL','detail':str(e)})
    print(results[-1],flush=True)
    (OUT/('results-retest.json' if len(sys.argv)>1 else 'results.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2))
def navigation():
    launch()
    for line in ['1','2','3','5','7']:
        tap('Línea '+line);assert 'Elige el sentido' in values()
        directions=[n.get('text') for n in tree().iter('node') if n.get('text','').startswith('A ')]
        assert directions;tap(directions[0]);assert 'LLEGADAS A ESTA PARADA' in values()
        tap('Línea '+line);assert 'Elige el sentido' in values()
def route():
    launch();tap('Ver todas las paradas');tap('1102 · Avenida del Puerto')
    assert 'Seleccionada' in values();shot('parada-seleccionada')
def map_test():
    launch();tap('Ver mapa de paradas');assert 'Mapa de paradas' in values()
    tap('Opciones del mapa');tap('Ocultar todas las líneas');tap('Mostrar todas las líneas');shot('mapa');tap('Volver a Líneas y llegadas')
    assert 'Mapa de paradas' not in values()
def gps():
    launch()
    for stop,label in [('1101','Plaza España'),('1110','Hospital Puerta del Mar'),('1101','Plaza España')]:
        # Use known coordinates: stop numbering is not assumed for the hospital.
        coords=['36.509067','-6.278601'] if stop=='1110' else ['36.534149','-6.292969']
        subprocess.run(['node','scripts/android-emulator.cjs','gps',*coords],cwd=ROOT,check=True,capture_output=True)
        tap('Usar mi ubicación');time.sleep(3)
        v=values();assert label in v and 'LLEGADAS A ESTA PARADA' in v,v
        shot('gps-'+stop)
    tap('Línea 1');assert 'Elige el sentido' in values()
    time.sleep(3);assert 'Elige el sentido' in values()
def dark():
    adb('shell','cmd','uimode','night','yes');launch();assert 'busmovil' in values()
def large():
    adb('shell','cmd','uimode','night','no');adb('shell','settings','put','system','font_scale','1.5');launch()
    tap('Línea 1');assert 'Elige el sentido' in values()
    launch();shot('fuente150-inicio');tap('Ver mapa de paradas');tap('Volver a Líneas y llegadas')
def landscape():
    adb('shell','settings','put','system','font_scale','1.0');adb('shell','settings','put','system','accelerometer_rotation','0')
    adb('shell','settings','put','system','user_rotation','1');launch();assert 'busmovil' in values()
    shot('horizontal-inicio')
def offline():
    launch();assert 'En directo' in values(), 'Se necesitan datos reales antes de cortar la red'
    adb('shell','svc','wifi','disable');adb('shell','svc','data','disable');time.sleep(2)
    adb('shell','input','swipe',540,400,540,1900,500)
    deadline=time.monotonic()+25
    while time.monotonic()<deadline:
        v=values()
        if 'No se pudieron actualizar' in v:break
    assert 'No se pudieron actualizar' in v,v
    assert 'Datos anteriores' in v and 'Dato anterior:' in v,v
    assert 'En directo' not in v,v
initial={k:adb('shell','settings','get','system',k) for k in ['font_scale','accelerometer_rotation','user_rotation']}
try:
    case('navegacion-cinco-lineas',navigation);case('recorrido',route);case('mapa-controles',map_test)
    case('gps-y-navegacion',gps);case('oscuro',dark);case('fuente150',large);case('horizontal',landscape);case('datos-antiguos',offline)
finally:
    adb('shell','svc','wifi','enable');adb('shell','svc','data','enable')
    for k,v in initial.items():adb('shell','settings','put','system',k,v)
    adb('shell','cmd','uimode','night','no')
    subprocess.run(['node','scripts/android-emulator.cjs','gps-stop'],cwd=ROOT,check=True)
    launch()
raise SystemExit(any(r['status']!='PASS' for r in results))
