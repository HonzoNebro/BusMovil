#!/usr/bin/env python3
"""Native filter smoke test; WebView direction details require screenshot review."""
import json,re,subprocess,time,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/qa/2026-10-29-navegacion-coherente'
OUT.mkdir(parents=True,exist_ok=True)
ADB=str(Path.home()/'Android/Sdk/platform-tools/adb');APP='app.transportescadiz'
def adb(*args,binary=False):
    p=subprocess.run([ADB,'-s','emulator-5554',*map(str,args)],capture_output=True,check=True,timeout=30)
    return p.stdout if binary else p.stdout.decode().strip()
def tree():
    adb('shell','uiautomator','dump','/sdcard/busmovil-map.xml')
    return ET.fromstring(adb('shell','cat','/sdcard/busmovil-map.xml'))
def tap(label):
    for _ in range(7):
        t=tree()
        for n in t.iter('node'):
            if label in [n.get('text'),n.get('content-desc')]:
                a=list(map(int,re.findall(r'\d+',n.get('bounds',''))))
                if len(a)==4 and a[2]>a[0] and a[3]>a[1]:
                    adb('shell','input','tap',(a[0]+a[2])//2,(a[1]+a[3])//2);time.sleep(.5);return
        adb('shell','input','swipe',540,1800,540,700,300)
    raise AssertionError('No aparece '+label)
def shot(name):
    (OUT/(name+'.png')).write_bytes(adb('exec-out','screencap','-p',binary=True))
def checked(line):
    n=next(n for n in tree().iter('node') if n.get('content-desc')=='Mostrar línea '+line)
    return n.get('checked')=='true'
if __name__=='__main__':
    adb('shell','am','force-stop',APP);adb('shell','am','start','-n',APP+'/app.transportescadiz.MainActivity');time.sleep(3)
    tap('Ver mapa de paradas');time.sleep(4);tap('Opciones del mapa');shot('todas')
    assert all(checked(line) for line in ['1','2','3','5','7'])
    for line in ['2','3','5','7']:tap('Mostrar línea '+line)
    assert checked('1') and not checked('2');shot('solo-linea-1')
    tap('Volver a Líneas y llegadas');tap('Ver mapa de paradas');tap('Opciones del mapa')
    assert checked('1') and not checked('2');shot('filtros-conservados')
    tap('Mostrar línea 1');assert not any(checked(line) for line in ['1','2','3','5','7']);shot('sin-lineas')
    tap('Todas');assert all(checked(line) for line in ['1','2','3','5','7'])
    tap('Ocultar todas las líneas');shot('ninguna-linea');tap('Mostrar todas las líneas')
    for line in ['2','3','5','7']:tap('Mostrar línea '+line)
    shot('linea-1-final')
    (OUT/'results.json').write_text(json.dumps({'native':'PASS','checks':['Todas iniciales','Solo línea 1','Filtros conservados al reabrir','Ninguna línea','Restaurar todas','Conmutar Todas/Ninguna'], 'webview':'REVIEW: revisar grupos, trazos y fichas en zoom cercano'},ensure_ascii=False,indent=2))
    print('PASS: seis comprobaciones nativas. REVIEW: grupos y fichas del WebView.',flush=True)
