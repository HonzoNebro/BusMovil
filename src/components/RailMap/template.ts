import { railCatalog, stopsForLines, type RailLine } from '../../services/rail';
import { translate } from '../../i18n/strings';
import type { Language } from '../../i18n/Language';
import { locales } from '../../i18n/Language';
export function buildRailMap(lines: RailLine[], language: Language) {
  const json = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');
  const routes = railCatalog.routes.filter((r) => lines.includes(r.line)),
    routeIds = new Set(routes.map((r) => r.id));
  const shapes = [
    ...new Set(
      railCatalog.trips.filter((t) => routeIds.has(t.route)).map((t) => t.shape)
    )
  ].map((id) => ({
    points: railCatalog.shapes[id],
    color: id.includes('T1') ? '#608500' : '#c91736'
  }));
  const labels = {
    destination: translate('Destino por confirmar', language),
    previous: translate('Posición anterior', language),
    updated: translate('Última actualización:', language),
    arrivals: translate('Ver llegadas', language)
  };
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
 <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
 <style>html,body,#map{margin:0;height:100%}.train{border:2px solid white;border-radius:10px;background:#c91736;color:white;box-shadow:0 2px 6px #0005;text-align:center;line-height:30px;font:700 14px/30px sans-serif}.train.tram{background:#608500}.leaflet-popup-content{font:14px/1.5 sans-serif;max-height:220px;overflow:auto}.leaflet-popup-content button{padding:10px;border:0;border-radius:10px;min-height:44px;background:#143b59;color:white;display:block}</style></head><body><div id="map"></div><script>const send=x=>window.ReactNativeWebView?.postMessage(JSON.stringify(x));window.onerror=()=>send({type:'error'});</script>
 <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="send({type:'error'})"></script><script>
 if(window.L){
 const map=L.map('map'),stops=${json(stopsForLines(lines))},shapes=${json(
    shapes
  )},labels=${json(labels)},locale=${json(locales[language])};
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://data.renfe.com/dataset/ubicacion-vehiculos">Renfe</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)'}).on('tileerror',()=>send({type:'error'})).addTo(map);
 shapes.forEach(s=>{if(s.points?.length)L.polyline(s.points,{color:s.color,weight:4,opacity:.7}).addTo(map);});
 stops.forEach(s=>{
 const node=document.createElement('div'),name=document.createElement('strong'),button=document.createElement('button');name.textContent=s.name;button.textContent=labels.arrivals;button.onclick=()=>send({type:'station',id:s.id});node.append(name,button);
 L.circleMarker([s.lat,s.lon],{radius:5,weight:2,color:'#143b59',fillColor:'white',fillOpacity:1}).addTo(map).bindTooltip(s.name).bindPopup(node).on('click',()=>send({type:'station',id:s.id}));
 });
 if(stops.length)map.fitBounds(L.latLngBounds(stops.map(s=>[s.lat,s.lon])),{padding:[24,24]});else map.setView([36.53,-6.29],12);
 const vehicles=new Map();
 function receive(event){
  let data;try{data=JSON.parse(event.data);}catch{return;}
  if(data.type==='focus'){const stop=stops.find(s=>s.id===data.id);if(stop)map.panTo([stop.lat,stop.lon]);}
  if(data.type!=='vehicles')return;
  const ids=new Set();
  data.items.forEach(v=>{
   ids.add(v.id);const fresh=!data.stale&&data.now-v.observedAt<=90000;
   const node=document.createElement('div'),name=document.createElement('strong'),dest=document.createElement('p'),time=document.createElement('small');
   name.textContent=v.label;dest.textContent=v.destination||labels.destination;time.textContent=(fresh?labels.updated:labels.previous)+' '+new Date(v.observedAt).toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit',second:'2-digit'});node.append(name,dest,time);
   if(vehicles.has(v.id)){const m=vehicles.get(v.id);m.setLatLng([v.lat,v.lon]);m.setOpacity(fresh?1:.4);m.setPopupContent(node);}
   else {const m=L.marker([v.lat,v.lon],{title:v.label,opacity:fresh?1:.4,icon:L.divIcon({className:'train'+(v.line==='T1'?' tram':''),html:v.line,iconSize:[42,30],iconAnchor:[21,15]})}).addTo(map).bindPopup(node);vehicles.set(v.id,m);}
  });
  vehicles.forEach((m,id)=>{if(!ids.has(id)){m.remove();vehicles.delete(id);}});
 }
 window.addEventListener('message',receive);document.addEventListener('message',receive);
 setTimeout(()=>map.invalidateSize(),0);send({type:'ready'});
 }
 </script></body></html>`;
}
