#!/usr/bin/env python3
"""Emulator-only checks for far/near clusters. Stop details require visual review."""
import importlib.util,json,time
from pathlib import Path
spec=importlib.util.spec_from_file_location('map_qa',Path(__file__).with_name('map-qa.py'))
q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
q.OUT=q.ROOT/'docs/qa/2026-10-29-mapa-agrupado';q.OUT.mkdir(parents=True,exist_ok=True)
def counts():
    return sorted(int(n.get('text')) for n in q.tree().iter('node') if n.get('text','').isdigit())
if __name__=='__main__':
    q.adb('shell','am','force-stop',q.APP);q.adb('shell','am','start','-n',q.APP+'/app.transportescadiz.MainActivity');time.sleep(3)
    q.tap('Ver mapa de paradas');time.sleep(3)
    for _ in range(3):q.tap('Alejar mapa')
    before=counts();assert len(before)==1 and before[0]>1,before
    q.shot('grupo-ciudad');q.tap(str(before[0]));time.sleep(1)
    assert counts()==before
    assert not any(n.get('content-desc')=='Volver al mapa' for n in q.tree().iter('node'))
    q.shot('grupo-centrado')
    for _ in range(5):q.tap('Ampliar mapa')
    assert len(counts())>1,counts();q.shot('subdivision-grupos')
    (q.OUT/'cluster-results.json').write_text(json.dumps({'status':'PASS','cityStopCount':before[0],'checks':['Una agrupación lejana con recuento real','Tocar grupo centra y no abre ficha','Ampliar subdivide en grupos menores'],'visualReview':'REVIEW: confirmar zoom constante al centrar y fichas individuales'},ensure_ascii=False,indent=2))
    print('PASS: ciudad, centrar grupo y subdivisión. REVIEW: zoom y fichas.',flush=True)
