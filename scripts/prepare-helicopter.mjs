// Run from the app root: node scripts/prepare-helicopter.mjs
// Optional offline source: node scripts/prepare-helicopter.mjs --source-file /path/to/source.glb
// Original model: Innerscene, CC0-1.0. This prepares animation groups, not a certified engineering model.
import fs from 'node:fs/promises';
import path from 'node:path';

const sourceUrl = 'https://www.innerscene.com/api/library/medium-helicopter-5e2a0edd/download';
const offlineIndex = process.argv.indexOf('--source-file');
let input;
if (offlineIndex >= 0) {
  input = await fs.readFile(process.argv[offlineIndex + 1]);
} else {
  const response = await fetch(sourceUrl, {headers: {'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(25000)});
  if (!response.ok) throw new Error(`Model download failed: HTTP ${response.status}. Use the prepared model from the kit.`);
  input = Buffer.from(await response.arrayBuffer());
}
if (input.toString('ascii', 0, 4) !== 'glTF' || input.readUInt32LE(4) !== 2) throw new Error('Expected a glTF 2.0 binary.');
const length = input.readUInt32LE(12);
const g = JSON.parse(input.toString('utf8', 20, 20 + length));
const binaryTail = input.subarray(20 + length);
if (g.nodes.length !== 131 || g.meshes.length !== 130 || g.nodes[35].name !== 'Hollow cabin shell with actual window openings') {
  throw new Error('Source model changed. Inspect its mesh names before regrouping; do not guess indices.');
}
const originalRoot = 130;
const used = new Set();
const groups = [];
const range = (a,b) => Array.from({length:b-a},(_,i)=>a+i);
function bounds(indices) {
  const a = indices.flatMap(i=>g.meshes[g.nodes[i].mesh].primitives.map(p=>g.accessors[p.attributes.POSITION]));
  return [0,1,2].map(axis=>[Math.min(...a.map(v=>v.min[axis])),Math.max(...a.map(v=>v.max[axis]))]);
}
function addGroup(name,indices,offset,order,{parentPivot=[0,0,0],pivot,label=name}={}) {
  const b = bounds(indices);
  pivot ??= b.map(([lo,hi])=>(lo+hi)/2);
  for (const i of indices) {
    if (used.has(i)) throw new Error(`Duplicate mesh ${i}`);
    const n = g.nodes[i];
    if (['translation','rotation','scale','matrix'].some(k=>k in n)) throw new Error(`Unexpected source transform ${i}`);
    used.add(i);
    n.translation = pivot.map(v=>-v);
  }
  const index=g.nodes.length;
  g.nodes.push({name,translation:pivot.map((v,i)=>v-parentPivot[i]),children:indices,
    extras:{assemblyOffset:offset,assemblyOrder:order,assemblyLabel:label}});
  groups.push({name,offset,order,meshCount:indices.length});
  return index;
}
const top=[];
top.push(addGroup('cabinShell',[35,...range(20,26),...range(53,57),...range(79,85)],[0,.55,0],2));
top.push(addGroup('cabinInterior',[26,...range(38,49),...range(85,116)],[0,-.22,0],0));
for (const [side,ids] of [['Left',[27,29,31,33]],['Right',[28,30,32,34]]]) {
  const b=bounds(ids);const sign=b[2][0]+b[2][1]>0?1:-1;
  top.push(addGroup('glazing'+side,ids,[0,.25,sign*1.65],4));
}
for (const [side,ids] of [['Left',[...range(0,7),14,36]],['Right',[...range(7,14),15,37]]]) {
  const b=bounds(ids);const sign=b[2][0]+b[2][1]>0?1:-1;
  top.push(addGroup('engine'+side,ids,[0,1.35,sign*1.45],5));
}
top.push(addGroup('transmission',[17,116,117],[0,1.65,0],6));
top.push(addGroup('landingGear',[18,19,...range(49,53),128,129],[0,-1,0],1));
const tailPivot=[-3.6,2.6,0];
const tail=addGroup('tailAssembly',[16,118,126,127],[-2.6,.35,0],3,{pivot:tailPivot});
const tailRotor=addGroup('tailRotor',range(119,126),[0,0,-.55],7,
  {parentPivot:tailPivot,pivot:[-6.773017,2.897693,-.4425]});
g.nodes[tail].children.push(tailRotor);top.push(tail);
const mainPivot=[1.806983,4.48,0];
const main=g.nodes.length;
g.nodes.push({name:'mainRotor',translation:mainPivot,children:[],
  extras:{assemblyOffset:[0,2.2,0],assemblyOrder:8,assemblyLabel:'Rotore principale'}});
groups.push({name:'mainRotor',offset:[0,2.2,0],order:8,meshCount:0});
g.nodes[main].children.push(addGroup('rotorHub',[...range(57,70),...range(74,79)],[0,0,0],8,
  {parentPivot:mainPivot,pivot:mainPivot}));
for(let n=70;n<74;n++) {
  const b=bounds([n]);const midpoint=b.map(([lo,hi])=>(lo+hi)/2);
  const offset=[(midpoint[0]-mainPivot[0])*.34,.08,(midpoint[2]-mainPivot[2])*.34];
  g.nodes[main].children.push(addGroup(`rotorBlade${String(n-69).padStart(2,'0')}`,[n],offset,n-60,
    {parentPivot:mainPivot}));
}
top.push(main);
if(used.size!==130) throw new Error('Some original meshes were not assigned.');
Object.assign(g.nodes[originalRoot],{name:'Helicopter',children:top});
g.nodes[originalRoot].extras={...g.nodes[originalRoot].extras,assemblyReady:true,
  sourceUrl:'https://www.innerscene.com/tools/library/3d-parts/medium-helicopter-5e2a0edd',
  sourceLicense:'CC0-1.0',assemblyNote:'Generic conceptual helicopter, not an identified Alidaunia aircraft.'};
const jsonBuffer=Buffer.from(JSON.stringify(g));
const padded=Buffer.concat([jsonBuffer,Buffer.alloc((4-jsonBuffer.length%4)%4,0x20)]);
const header=Buffer.alloc(20);
header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(20+padded.length+binaryTail.length,8);
header.writeUInt32LE(padded.length,12);header.writeUInt32LE(0x4E4F534A,16);
const output=Buffer.concat([header,padded,binaryTail]);
const destination=path.resolve('public/models/helicopter-assembly.glb');
await fs.mkdir(path.dirname(destination),{recursive:true});
await fs.writeFile(destination,output);
await fs.writeFile(path.resolve('assembly-groups.json'),JSON.stringify(groups,null,2));
console.log(`Prepared ${destination}: ${output.length} bytes, ${used.size} meshes, ${groups.length} groups.`);
