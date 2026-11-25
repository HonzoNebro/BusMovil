#!/usr/bin/env python3
"""Black-box QA against BusMovil on emulator-5554; evidence in work/qa."""
import argparse,json,os,re,signal,subprocess,sys,time,xml.etree.ElementTree as ET
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('BUSMOVIL_QA_OUTPUT',str(ROOT/'work/qa'))); OUT.mkdir(parents=True,exist_ok=True)
ADB=str(Path.home()/'Android/Sdk/platform-tools/adb')
APP='app.transportescadiz'; SERIAL='emulator-5554'
results=[]; current=''; last=None

class ReviewRequired(Exception):
    pass

def terminate(_signum,_frame):
    raise SystemExit(143)
signal.signal(signal.SIGTERM,terminate)

def adb(*args,timeout=25,binary=False):
    p=subprocess.run([ADB,'-s',SERIAL,*map(str,args)],capture_output=True,timeout=timeout)
    if p.returncode: raise RuntimeError(p.stderr.decode(errors='replace') or p.stdout.decode(errors='replace'))
    return p.stdout if binary else p.stdout.decode(errors='replace').strip()

def dump():
    global last
    adb('shell','uiautomator','dump','/sdcard/busmovil-qa.xml')
    xml=adb('shell','cat','/sdcard/busmovil-qa.xml')
    last=ET.fromstring(xml)
    (OUT/f'{current}.xml').write_text(xml)
    return last

def text(tree=None):
    if tree is None: tree=dump()
    return '\n'.join(n.get('text','') for n in tree.iter('node') if n.get('text'))

def tap(label,contains=False,_attempt=0):
    tree=dump()
    for n in tree.iter('node'):
        values=[n.get('text',''),n.get('content-desc','')]
        if any((label in v if contains else label==v) for v in values):
            bounds=list(map(int,re.findall(r'\d+',n.get('bounds',''))))
            if len(bounds)==4:
                x1,y1,x2,y2=bounds
                if x2>x1 and y2>y1:
                    adb('shell','input','tap',(x1+x2)//2,(y1+y2)//2);return
    if _attempt < 6 and label == 'Ver mapa de paradas':
        swipe();return tap(label,contains,_attempt+1)
    raise AssertionError(f'No se encuentra: {label}. Pantalla: {text(tree)[:1400]}')

def swipe(up=True):
    # UIAutomator bounds follow the current rotation; physical wm size does not.
    tree=last if last is not None else dump()
    bounds=[list(map(int,re.findall(r'\d+',n.get('bounds','')))) for n in tree.iter('node')]
    width=max((b[2] for b in bounds if len(b)==4),default=1080)
    height=max((b[3] for b in bounds if len(b)==4),default=2400)
    x=width//2;start=int(height*.8);end=int(height*.22)
    adb('shell','input','swipe',x,start if up else end,x,end if up else start,350)

def top():
    tree=last if last is not None else dump()
    bounds=[list(map(int,re.findall(r'\d+',n.get('bounds','')))) for n in tree.iter('node')]
    width=max((b[2] for b in bounds if len(b)==4),default=1080)
    height=max((b[3] for b in bounds if len(b)==4),default=2400)
    for _ in range(5):
        adb('shell','input','swipe',width//2,int(height*.22),width//2,int(height*.8),250)

def launch():
    adb('shell','am','force-stop',APP)
    adb('shell','am','start','-n',f'{APP}/app.transportescadiz.MainActivity')
    time.sleep(1.5)

def capture():
    (OUT/f'{current}.png').write_bytes(adb('exec-out','screencap','-p',binary=True))

def wait_for(fragment,timeout=16):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        value=text()
        if fragment in value:return value
        time.sleep(.5)
    raise AssertionError(f'No aparece {fragment!r} en {timeout}s. Pantalla: {value[:1500]}')

def case(name,fn):
    global current
    if options.only and name not in options.only: return
    current=name
    start=time.monotonic(); status='PASS'; detail=''
    try: detail=fn() or ''
    except ReviewRequired as e:status='REVIEW';detail=str(e)
    except AssertionError as e:status='FAIL';detail=str(e)
    except Exception as e:status='ERROR';detail=str(e)
    try: capture()
    except Exception as e:detail+=f' [captura: {e}]'
    results.append({'case':name,'status':status,'seconds':round(time.monotonic()-start,1),'detail':detail})
    print(json.dumps(results[-1],ensure_ascii=False),flush=True)
    (OUT/f'{run_name}.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))

def gps(lat,lon):
    subprocess.run(['node',str(ROOT/'scripts/android-emulator.cjs'),'gps',str(lat),str(lon)],
        cwd=ROOT,check=True,capture_output=True,timeout=15)

def read_location(timeout=25):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        value=text()
        if 'Buscando ubicación' in value:
            time.sleep(.5);continue
        fields={n.get('resource-id','').split('/')[-1]:n.get('text','') for n in last.iter('node')}
        if 'Sugerida automáticamente por proximidad' not in fields.get('selected-stop-origin',''):
            top();value=text()
            fields={n.get('resource-id','').split('/')[-1]:n.get('text','') for n in last.iter('node')}
        if 'Sugerida automáticamente por proximidad' in fields.get('selected-stop-origin','') and fields.get('selected-stop-distance'):
            # Normalize the verified location card to the older report's sentence format.
            name=fields['selected-stop-name'];distance=fields['selected-stop-distance'].split(' · ')[0]
            return value+'\nTu parada más cercana es '+name+' ('+distance+').'
        if 'No se pudo obtener' in value or 'ubicación está bloqueada' in value:
            raise AssertionError(value[:1400])
        time.sleep(.5)
    raise AssertionError('No se obtiene una ubicación actualizada: '+value[:1600])

def grant():
    for perm in ['ACCESS_COARSE_LOCATION','ACCESS_FINE_LOCATION']:
        adb('shell','pm','grant',APP,'android.permission.'+perm)

def cold():
    launch(); assert 'busmovil' in text(); return 'Pantalla principal visible sin Metro.'

def line_navigation():
    launch()
    for line in ['1','2','3','5','7']:
        for _ in range(3):
            if f'Línea {line}' in text():break
            swipe()
        tap(f'Línea {line}')
        value=text()
        assert 'Elige el sentido de tu viaje' in value, f'No abre sentidos de línea {line}: {value}'
        directions=[n.get('text') for n in last.iter('node') if n.get('text','').startswith('A ')]
        assert directions,f'No hay sentidos línea {line}'
        tap(directions[0]); value=text()
        assert 'LLEGADAS A ESTA PARADA' in value,f'No abre paradas línea {line}'
        tap(f'Línea {line}');value=text()
        assert 'Elige el sentido de tu viaje' in value,f'No vuelve a sentidos de línea {line}'
    return 'Se abren sentidos y paradas y se vuelve a líneas en las cinco líneas.'

def expand():
    launch();tap('Línea 1');tap('A Plaza España')
    tree=dump()
    stops=[n.get('content-desc') for n in tree.iter('node') if re.match(r'^\d{4} ·',n.get('content-desc',''))]
    assert stops,'No hay paradas';tap(stops[0]);value=text()
    assert any(s in value for s in ['Sin próximas llegadas','Primer servicio',' min','Llegando']),value
    tap(stops[0]);return f'Acordeón de {stops[0]} abre/cierra.'

def map_basic():
    launch();tap('Ver mapa de paradas');value=wait_for('Grupos:')
    time.sleep(5);value=text();assert 'Mapa de paradas' in value
    tap('Opciones del mapa');tap('Ocultar todas las líneas');assert '0 líneas visibles' in text()
    tap('Mostrar todas las líneas');assert '5 líneas visibles' in text()
    tap('Volver a Líneas y llegadas');assert 'Mapa de paradas' not in text()
    return 'Modal, visibilidad de marcadores y cierre funcionan.'

def map_back():
    launch();tap('Ver mapa de paradas');wait_for('Grupos:')
    adb('shell','input','keyevent','KEYCODE_BACK');assert 'Mapa de paradas' not in text()
    return 'Atrás cierra el mapa y mantiene la app.'

def map_repeat():
    launch()
    for _ in range(5):
        tap('Ver mapa de paradas');wait_for('Grupos:');tap('Volver a Líneas y llegadas')
    assert 'Mapa de paradas' not in text();return 'Cinco aperturas/cierres consecutivos sin crash.'

def gps_stop(lat,lon,label):
    launch();gps(lat,lon);tap('Usar mi ubicación')
    value=read_location()
    nearest=re.search(r'Tu parada más cercana[^\n]+',value)[0]
    assert label in nearest and '(0 m)' in nearest,nearest
    return nearest

def gps_move():
    gps_stop(36.534149,-6.292969,'Plaza España')
    gps(36.509067,-6.278601);tap('Usar mi ubicación');value=read_location()
    assert 'Hospital Puerta del Mar (0 m)' in value,value[:1500]
    return re.search(r'Tu parada más cercana[^\n]+',value)[0]

def nav_after_gps():
    gps_stop(36.534149,-6.292969,'Plaza España')
    wait_for('LLEGADAS A ESTA PARADA',20);top();tap('Línea 2');value=text()
    assert 'Elige el sentido de tu viaje' in value,'El GPS vuelve a imponer la línea/sentido: '+value[:1200]
    return 'Se permite cambiar de línea tras localizarse.'

def directions_after_gps():
    gps_stop(36.534149,-6.292969,'Plaza España')
    wait_for('LLEGADAS A ESTA PARADA',20);top();tap('Línea 1');value=text()
    assert 'Elige el sentido de tu viaje' in value,'Volver a sentidos se revierte automáticamente: '+value[:1200]

def gps_scroll_target():
    launch();gps(36.534149,-6.292969);tap('Usar mi ubicación')
    value=wait_for('Parada 1101 · Plaza España',25)
    assert 'LLEGADAS A ESTA PARADA' in value,'La tarjeta de la parada no queda visible: '+value
    return 'La tarjeta de llegadas de la parada 1101 queda visible sin desplazar manualmente.'


def gps_offset():
    launch();gps(36.5092,-6.2787);tap('Usar mi ubicación');value=read_location()
    assert 'Hospital Puerta del Mar (17 m)' in value,value
    return 'Posición desplazada detectada a 17 m del hospital.'

def gps_far():
    launch();gps(40.4168,-3.7038);tap('Usar mi ubicación');value=read_location()
    return 'OBSERVACIÓN: '+re.search(r'Tu parada más cercana[^\n]+',value)[0]

def gps_disabled():
    launch();adb('shell','cmd','location','set-location-enabled','false')
    value=text()
    if 'No location access' in value and 'Close' in value:tap('Close')
    tap('Usar mi ubicación');value=text()
    # Dismiss the provider's settings prompt if present, then check the app recovers.
    for label in ['No thanks','No, thanks','No gracias','Cancelar','NO, THANKS']:
        if label in value: tap(label);break
    time.sleep(11);value=text()
    assert 'busmovil' in value, 'Un diálogo del sistema impide completar el caso: '+value[:900]
    assert 'Buscando ubicación' not in value, 'La solicitud queda bloqueada con GPS apagado.'
    assert 'No se pudo obtener' in value or 'ubicación no está disponible' in value or 'ubicación del dispositivo está desactivada' in value, 'No se informa el fallo del GPS: '+value[:900]
    return value[:1200]

def offline():
    adb('shell','svc','wifi','disable');adb('shell','svc','data','disable')
    launch();value=wait_for('No se pudieron actualizar',25)
    (OUT/'offline-connectivity.txt').write_text(adb('shell','dumpsys','connectivity'))
    assert any(s in value for s in ['No se pudieron actualizar','Sin conexión','sin conexión','Error de conexión']), 'Sin red no se informa error; la UI muestra: '+value[-2200:]

def offline_map():
    adb('shell','svc','wifi','disable');adb('shell','svc','data','disable')
    launch();tap('Ver mapa de paradas');time.sleep(7);value=text()
    for _ in range(3):
        if 'No thanks' not in value:break
        tap('No thanks');time.sleep(1);value=text()
    assert 'Mapa de paradas' in value,'Un diálogo del sistema impide completar el caso: '+value
    if 'Leaflet' in value or 'OpenStreetMap' in value:
        return 'OBSERVACIÓN: mapa disponible desde caché; no se exige aviso de error si el contenido está disponible.'
    if any(s in value.lower() for s in ['sin conexión','no se pudo cargar','error al cargar','offline']):
        return 'Se muestra un aviso de conexión.'
    raise ReviewRequired('El contenido del WebView no es accesible por UIAutomator. Revisar la captura antes de atribuir un fallo al mapa; puede mostrar teselas cacheadas.')

def online():
    adb('shell','svc','wifi','enable');adb('shell','svc','data','enable');time.sleep(3)
    launch();value=wait_for('LLEGADAS A ESTA PARADA',30)
    assert 'Cortadura' in value
    return 'La app vuelve a cargar las líneas con llegadas tras recuperar red.'

def rotation():
    launch();adb('shell','settings','put','system','accelerometer_rotation','0');adb('shell','settings','put','system','user_rotation','1');time.sleep(2)
    value=text(); assert 'busmovil' in value
    for _ in range(5):
        if 'Ver mapa de paradas' in text():break
        swipe()
    tap('Ver mapa de paradas');assert 'Volver a Líneas y llegadas' in '\n'.join(n.get('content-desc','') for n in dump().iter('node'));tap('Volver a Líneas y llegadas')
    return 'En horizontal se puede abrir/cerrar el mapa.'

def font_large():
    adb('shell','settings','put','system','user_rotation','0');adb('shell','settings','put','system','font_scale','1.5');launch()
    assert 'busmovil' in text()
    for _ in range(6):
        if 'Ver mapa de paradas' in text():break
        swipe()
    tap('Ver mapa de paradas');assert 'Volver a Líneas y llegadas' in '\n'.join(n.get('content-desc','') for n in dump().iter('node'));tap('Volver a Líneas y llegadas');return 'Fuente 150%: controles principales accesibles por desplazamiento.'


def reset_permissions():
    adb('shell','am','force-stop',APP)
    for perm in ['ACCESS_FINE_LOCATION','ACCESS_COARSE_LOCATION']:
        name='android.permission.'+perm
        adb('shell','pm','revoke',APP,name)
        adb('shell','pm','clear-permission-flags',APP,name,'user-set','user-fixed')

def permission_deny():
    reset_permissions();launch();tap('Usar mi ubicación');value=text()
    for label in ["Don’t allow", "Don't allow",'No permitir','Deny']:
        if label in value:tap(label);break
    else:raise AssertionError('No aparece diálogo de permisos: '+value)
    value=wait_for('No se concedió permiso',8)
    assert 'Buscando ubicación' not in value
    return 'Denegación explícita muestra error y libera el botón.'

def permission_approximate():
    reset_permissions();launch();gps(36.534149,-6.292969);tap('Usar mi ubicación');value=wait_for('Approximate',12)
    for label in ['Approximate','Aproximada']:
        if label in value:tap(label);break
    else:raise AssertionError('No aparece opción de ubicación aproximada: '+value)
    value=text()
    for label in ['While using the app','Mientras se usa la aplicación','While using this app']:
        if label in value:tap(label);break
    else:raise AssertionError('No aparece permiso durante uso: '+value)
    value=text()
    (OUT/'approximate-package-permissions.txt').write_text(adb('shell','dumpsys','package',APP))
    if 'No se concedió permiso' in value or 'ubicación está bloqueada' in value:
        raise AssertionError('Android concede ubicación aproximada pero la app la rechaza como denegada o bloqueada. '+value[:900])
    value=read_location(30)
    assert 'Ubicación aproximada: la parada sugerida puede variar' in value,value
    assert 'Fecha de la ubicación aproximada:' in value,value
    return value[:1000]

def permission_recovery():
    grant();launch();gps(36.534149,-6.292969);tap('Usar mi ubicación');value=read_location()
    assert 'Plaza España' in value
    return 'La ubicación funciona tras restaurar el permiso preciso.'

def map_without_permissions():
    reset_permissions();launch();tap('Ver mapa de paradas');wait_for('Grupos:');time.sleep(3)
    value=text();assert 'Volver a Líneas y llegadas' in '\n'.join(n.get('content-desc','') for n in dump().iter('node'));tap('Volver a Líneas y llegadas');assert 'Mapa de paradas' not in text()
    return 'El mapa abre/cierra sin permiso de ubicación y no provoca cierre de la app.'

def background_resume():
    grant();launch();tap('Ver mapa de paradas');wait_for('Grupos:')
    adb('shell','input','keyevent','KEYCODE_HOME');time.sleep(2)
    adb('shell','am','start','-n',f'{APP}/app.transportescadiz.MainActivity');value=text()
    assert 'Volver a Líneas y llegadas' in '\n'.join(n.get('content-desc','') for n in dump().iter('node')),'Se pierde el modal al volver desde segundo plano: '+value
    tap('Volver a Líneas y llegadas');return 'Volver de segundo plano conserva el modal y permite cerrarlo.'


def acceptance_cycles():
    grant();launch()
    checkpoints=[]
    for cycle in range(1,6):
        for index,(lat,lon,label) in enumerate([
            (36.534149,-6.292969,'Plaza España'),
            (36.509067,-6.278601,'Hospital Puerta del Mar'),
            (36.534149,-6.292969,'Plaza España')
        ]):
            gps(lat,lon);tap('Usar mi ubicación');value=read_location()
            nearest=re.search(r'Tu parada más cercana[^\n]+',value)[0]
            assert label in nearest and '(0 m)' in nearest,f'Ciclo {cycle}: {nearest}'
            checkpoints.append({'cycle':cycle,'step':index+1,'nearest':nearest})
            (OUT/'gps-cycles-checkpoints.json').write_text(json.dumps(checkpoints,ensure_ascii=False,indent=2))
            print(f'CICLO {cycle}/5 PASO {index+1}/3: {nearest}',flush=True)
    return '15 solicitudes únicas correctas: cinco recorridos Plaza España → hospital → Plaza España, sin reintentos.'

def acceptance_focus(large=False):
    adb('shell','settings','put','system','accelerometer_rotation','0')
    adb('shell','settings','put','system','user_rotation','0' if large else '1')
    adb('shell','settings','put','system','font_scale','1.5' if large else '1.0')
    launch();gps(36.534149,-6.292969)
    for _ in range(6):
        if 'Usar mi ubicación' in text():break
        swipe()
    tap('Usar mi ubicación');value=wait_for('Parada 1101 · Plaza España',30)
    assert 'LLEGADAS A ESTA PARADA' in value,value
    return 'Tarjeta de llegadas de la parada 1101 visible. Requiere además inspeccionar la captura para validar el layout.'



def warm_offline():
    adb('shell','settings','put','system','font_scale','1.0')
    adb('shell','settings','put','system','user_rotation','0')
    launch();tap('Línea 1');tap('A Cortadura');tap('1101 · Plaza España')
    wait_for(' min',25)
    for _ in range(10):
        value=text()
        if 'Última actualización:' in value:break
        swipe()
    before=re.search(r'Última actualización:[^\n]+',value)
    assert before,'No se encuentra la fecha de los datos iniciales'
    before=before[0]
    # Disconnect before scrolling to the top: excess downward swipes can trigger refresh.
    adb('shell','svc','wifi','disable');adb('shell','svc','data','disable')
    deadline=time.monotonic()+8
    while time.monotonic()<deadline:
        if 'Active default network: none' in adb('shell','dumpsys','connectivity'):break
        time.sleep(.25)
    else:raise AssertionError('No se ha desconectado el emulador; no es una prueba offline válida')
    top()
    tree=dump()
    adb('shell','input','swipe',540,400,540,1800,500)
    wait_for('No se pudieron actualizar',25)
    for _ in range(8):
        value=text()
        if 'Dato anterior:' in value:break
        swipe()
    assert 'Dato anterior:' in value,'No se conservan y etiquetan las estimaciones: '+value
    (OUT/'29-warm-offline-rows.png').write_bytes(adb('exec-out','screencap','-p',binary=True))
    for _ in range(10):
        value=text()
        if 'Última actualización:' in value:break
        swipe()
    after=re.search(r'Última actualización:[^\n]+',value)
    assert after and after[0]==before,f'Fecha adelantada tras fallo: {before!r} -> {after[0] if after else value}'
    return 'Se mantienen las llegadas como «Dato anterior», con la fecha original: '+before


parser=argparse.ArgumentParser();parser.add_argument('suite',choices=['all','navigation','location','resilience','permissions','acceptance']);parser.add_argument('--only',nargs='+');options=parser.parse_args()
run_name=options.suite+('-retest' if options.only else '')
if options.suite=='all':
    codes=[]
    for suite in ['navigation','location','resilience','permissions']:
        extra=['--only',*options.only] if options.only else []
        codes.append(subprocess.run([sys.executable,__file__,suite,*extra],cwd=ROOT).returncode)
    raise SystemExit(1 if any(codes) else 0)
if not adb('shell','pm','path',APP).startswith('package:'):
    raise SystemExit('BusMovil no está instalado en emulator-5554. Ejecuta npm run emulator primero.')
initial={k:adb('shell','settings','get','system',k) for k in ['font_scale','accelerometer_rotation','user_rotation']}
try:
    grant();adb('shell','cmd','location','set-location-enabled','true')
    if options.suite=='navigation':
        for name,fn in [('01-cold-start',cold),('02-five-lines-navigation',line_navigation),('03-stop-expand',expand),('04-map-controls',map_basic),('05-map-android-back',map_back),('06-map-repeat',map_repeat)]:case(name,fn)
    elif options.suite=='location':
        for name,fn in [('07-gps-plaza',lambda:gps_stop(36.534149,-6.292969,'Plaza España')),('08-gps-hospital',lambda:gps_stop(36.509067,-6.278601,'Hospital Puerta del Mar')),('09-gps-move',gps_move),('10-gps-offset',gps_offset),('11-navigation-after-gps',nav_after_gps),('12-directions-after-gps',directions_after_gps),('13-far-from-cadiz',gps_far),('14-gps-disabled',gps_disabled),('25-gps-scroll-target',gps_scroll_target)]:case(name,fn)
    elif options.suite=='acceptance':
        for name,fn in [('26-gps-five-cycles',acceptance_cycles),('27-focus-landscape',lambda:acceptance_focus(False)),('28-focus-large-font',lambda:acceptance_focus(True)),('29-warm-offline',warm_offline)]:case(name,fn)
    elif options.suite=='permissions':
        for name,fn in [('20-permission-deny',permission_deny),('21-permission-approximate',permission_approximate),('22-permission-recovery',permission_recovery),('23-map-without-permissions',map_without_permissions),('24-background-resume',background_resume)]:case(name,fn)
    else:
        for name,fn in [('15-offline-arrivals',offline),('16-offline-map',offline_map),('17-network-recovery',online),('18-landscape',rotation),('19-large-font',font_large)]:case(name,fn)
finally:
    for k,v in initial.items():
        if v!='null':adb('shell','settings','put','system',k,v)
    adb('shell','svc','wifi','enable');adb('shell','svc','data','enable')
    adb('shell','cmd','location','set-location-enabled','true');grant()
    gps(36.534149,-6.292969);launch()
    (OUT/f'{run_name}-logcat.txt').write_text(adb('logcat','-d','-v','threadtime','-t','3000',timeout=30))
print('RESULTS',json.dumps({s:sum(r['status']==s for r in results) for s in ['PASS','FAIL','ERROR','REVIEW']}),flush=True)

raise SystemExit(1 if any(r['status']!='PASS' for r in results) else 0)
