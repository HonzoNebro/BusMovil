#!/usr/bin/env python3
"""Extract the Cádiz nucleus from an official Renfe GTFS zip, without altering stop names."""
import argparse,csv,datetime,hashlib,io,json,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('archive');args=p.parse_args()
archive=Path(args.archive);z=zipfile.ZipFile(archive)
def rows(name):
    for row in csv.DictReader(io.TextIOWrapper(z.open(name),encoding='utf-8-sig')):
        yield {k.strip():v.strip() for k,v in row.items() if k}
routes={r['route_id']:{'id':r['route_id'],'line':r['route_short_name'],'name':r['route_long_name'].strip(),'color':'#'+r['route_color']} for r in rows('routes.txt') if r['route_id'].startswith('31')}
trips={t['trip_id']:{'id':t['trip_id'],'route':t['route_id'],'service':t['service_id'],'shape':t['shape_id'],'stops':[]} for t in rows('trips.txt') if t['route_id'] in routes}
def minutes(value):
    h,m,s=map(int,value.split(':'));return h*60+m+s/60
for s in rows('stop_times.txt'):
    if s['trip_id'] in trips:
        trips[s['trip_id']]['stops'].append([int(s['stop_sequence']),s['stop_id'],minutes(s['arrival_time']),minutes(s['departure_time'])])
for t in trips.values():
    t['stops']=[s[1:] for s in sorted(t['stops'])]
ids={s[0] for t in trips.values() for s in t['stops']}
stops=[{'id':s['stop_id'],'name':s['stop_name'],'lat':float(s['stop_lat']),'lon':float(s['stop_lon'])} for s in rows('stops.txt') if s['stop_id'] in ids]
services={t['service'] for t in trips.values()}
calendar=[{k:s[k] for k in ['service_id','start_date','end_date','monday','tuesday','wednesday','thursday','friday','saturday','sunday']} for s in rows('calendar.txt') if s['service_id'] in services]
exceptions=[{'service':r['service_id'],'date':r['date'],'type':int(r['exception_type'])} for r in rows('calendar_dates.txt') if r['service_id'] in services] if 'calendar_dates.txt' in z.namelist() else []
shape_ids={t['shape'] for t in trips.values()};shapes={i:[] for i in shape_ids}
for s in rows('shapes.txt'):
    if s['shape_id'] in shapes:shapes[s['shape_id']].append([int(s['shape_pt_sequence']),float(s['shape_pt_lat']),float(s['shape_pt_lon'])])
shapes={k:[[round(s[1],6),round(s[2],6)] for s in sorted(v)] for k,v in shapes.items()}
out={'source':'https://data.renfe.com/dataset/horarios-cercanias','license':'CC BY 4.0','importedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'validFrom':min(s['start_date'] for s in calendar),'validUntil':max(s['end_date'] for s in calendar),'routes':list(routes.values()),'stops':stops,'trips':list(trips.values()),'calendar':calendar,'exceptions':exceptions,'shapes':shapes}
target=Path(__file__).resolve().parents[1]/'src/assets/rail/catalog.json';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print(f'{len(stops)} estaciones, {len(trips)} viajes; vigencia {out["validFrom"]}–{out["validUntil"]}; {target.stat().st_size} bytes.')
