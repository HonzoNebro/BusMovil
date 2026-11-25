import type { RechargePoint } from '../../services/rechargePoints';
import type { UserPosition } from '../../services/walkingStops';

export function buildRechargeMap(
  points: RechargePoint[],
  position?: UserPosition,
  language = 'es'
) {
  const data = points
    .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
    .map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      hours: p.hours,
      network: p.network,
      lat: p.latitude,
      lon: p.longitude
    }));
  const safe = (value: unknown) =>
    JSON.stringify(value).replace(/</g, '\\u003c');
  const labels =
    language === 'fr'
      ? {
          urban: 'Urbain',
          consortium: 'Consorcio',
          both: 'Les deux',
          navigate: 'Itinéraire ↗',
          close: 'Fermer les détails',
          unknown: 'Horaires non disponibles'
        }
      : language === 'pt'
      ? {
          urban: 'Urbano',
          consortium: 'Consórcio',
          both: 'Ambos',
          navigate: 'Como chegar ↗',
          close: 'Fechar detalhes',
          unknown: 'Horário indisponível'
        }
      : language === 'en'
      ? {
          urban: 'Urban',
          consortium: 'Consortium',
          both: 'Both',
          navigate: 'Directions ↗',
          close: 'Close details',
          unknown: 'Opening hours unavailable'
        }
      : {
          urban: 'Urbano',
          consortium: 'Consorcio',
          both: 'Ambos',
          navigate: 'Cómo llegar ↗',
          close: 'Cerrar detalle',
          unknown: 'Horario no disponible'
        };
  return `<!DOCTYPE html><html lang="${language}"><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0}body{background:#dce5e9}.point{color:white;border:2px solid white;border-radius:50%;text-align:center;line-height:28px;font-size:18px;box-shadow:0 2px 5px #0005}.urban{background:#143b59}.consortium{background:#b34e06}.both{background:#754197}.leaflet-container{font-family:sans-serif}.legend{padding:5px 8px;background:#fff;color:#143b59;border-radius:6px;font-size:11px;box-shadow:0 1px 5px #0003}.leaflet-popup-content{margin:14px;max-height:300px;overflow:auto;line-height:1.45}.detail{color:#152b44}.detail h3{font-size:16px;margin:0 0 7px}.detail p{margin:6px 0}.detail small{color:#5f7083}.detail button{display:block;min-height:44px;width:100%;margin-top:8px;border:0;border-radius:8px;padding:8px;background:#edf1f5;color:#143b59;font-weight:600;font-size:14px}button{cursor:pointer}</style>
</head><body><div id="map"></div><script>
const send=value=>window.ReactNativeWebView?.postMessage(JSON.stringify(value));
window.onerror=()=>send({type:'error'});
</script><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="send({type:'error'})"></script><script>
if(window.L){
const map=L.map('map',{closePopupOnClick:true}).setView([36.5297,-6.2926],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).on('tileerror',()=>send({type:'error'})).addTo(map);
const points=${safe(data)},position=${safe(position ?? null)},labels=${safe(
    labels
  )};
const groups=new Map();
points.forEach(p=>{const key=p.lat.toFixed(6)+','+p.lon.toFixed(6);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);});
groups.forEach(group=>{
 const networks=new Set(group.map(p=>p.network)),kind=networks.size>1?'both':group[0].network;
 const symbol=kind==='urban'?'●':kind==='consortium'?'◆':'◈';
 const marker=L.marker([group[0].lat,group[0].lon],{icon:L.divIcon({className:'point '+kind,html:symbol,iconSize:[30,30],iconAnchor:[15,15]}),title:group.map(p=>p.name).join(' / ')}).addTo(map);
 const panel=document.createElement('div');panel.className='detail';
 group.forEach(p=>{
  const h=document.createElement('h3');h.textContent=p.name;panel.appendChild(h);
  const type=document.createElement('small');type.textContent=labels[p.network];panel.appendChild(type);
  const address=document.createElement('p');address.textContent=p.address;panel.appendChild(address);
  const hours=document.createElement('p');hours.textContent=p.hours||labels.unknown;panel.appendChild(hours);
  const go=document.createElement('button');go.textContent=labels.navigate;go.onclick=()=>send({type:'navigate',id:p.id});panel.appendChild(go);
 });
 const close=document.createElement('button');close.textContent=labels.close;close.onclick=()=>map.closePopup();panel.appendChild(close);
 marker.bindPopup(panel,{closeOnClick:true,autoClose:true,maxWidth:280,minWidth:190});
});
map.on('click',()=>map.closePopup());
const legend=L.control({position:'bottomleft'});legend.onAdd=()=>{const node=document.createElement('div');node.className='legend';node.textContent='● '+labels.urban+'   ◆ '+labels.consortium+'   ◈ '+labels.both;return node;};legend.addTo(map);
if(position){L.circleMarker([position.latitude,position.longitude],{radius:7,color:'#fff',weight:3,fillColor:'#2185d0',fillOpacity:1}).addTo(map);}
if(points.length){map.fitBounds(L.latLngBounds(points.map(p=>[p.lat,p.lon])),{padding:[28,28],maxZoom:16});}
setTimeout(()=>map.invalidateSize(),0);
}
</script></body></html>`;
}
