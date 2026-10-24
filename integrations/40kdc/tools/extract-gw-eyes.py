#!/usr/bin/env python3
"""Audit Event Companion v1.3 (pages 9–53). Requires pypdf, Pillow and 2x rendered pages.
Not a generic parser for future GW PDFs: changed artwork/layout must be reviewed.
"""
import json,math,sys
from pathlib import Path
from PIL import Image
from pypdf import PdfReader
from pypdf.generic import ContentStream
if len(sys.argv) != 4:
 raise SystemExit('Usage: extract-gw-eyes.py companion.pdf rendered-page-directory output.json')
r=PdfReader(sys.argv[1])
rendered=Path(sys.argv[2])
def mul(a,b):
 return [a[0]*b[0]+a[1]*b[2],a[0]*b[1]+a[1]*b[3],a[2]*b[0]+a[3]*b[2],a[2]*b[1]+a[3]*b[3],a[4]*b[0]+a[5]*b[2]+b[4],a[4]*b[1]+a[5]*b[3]+b[5]]
def extract(page):
 matrix=[1,0,0,1,0,0];color=None;stack=[];path=[];shapes=[]
 def point(x,y):return (x*matrix[0]+y*matrix[2]+matrix[4],x*matrix[1]+y*matrix[3]+matrix[5])
 for args,op in ContentStream(page.get_contents(),r).operations:
  if op==b'q':stack.append((matrix[:],color))
  elif op==b'Q':matrix,color=stack.pop()
  elif op==b'cm':matrix=mul(list(map(float,args)),matrix)
  elif op==b'k':color=tuple(round(float(x),3) for x in args)
  elif op in [b'rg',b'g']:color=None
  elif op in [b'm',b'l']:path.append((op,[point(float(args[0]),float(args[1]))]))
  elif op==b'c':path.append((op,[point(float(args[i]),float(args[i+1])) for i in range(0,6,2)]))
  elif op==b're':
   x,y,w,h=map(float,args);path.append((op,[point(x,y),point(x+w,y+h)]))
  elif op in [b'f',b'f*',b'B',b'B*']:
   if color in [(0,0,0,.6),(0,0,0,0)] and path:
    pts=[p for _,ps in path for p in ps];xs=[p[0] for p in pts];ys=[p[1] for p in pts]
    shapes.append({'color':color,'path':path[:],'bbox':(min(xs),min(ys),max(xs),max(ys))})
   path=[]
  elif op in [b'n',b'S',b's']:path=[]
 circles=[]
 for shape in shapes:
  bb=shape['bbox'];w=bb[2]-bb[0];h=bb[3]-bb[1]
  if shape['color']==(0,0,0,.6) and len(shape['path'])==5 and sum(op==b'c' for op,_ in shape['path'])==4 and 10<w<25 and abs(w-h)<1:
   cx=(bb[0]+bb[2])/2;cy=(bb[1]+bb[3])/2;radius=(w+h)/4;cross=False
   eye_details=[o for o in shapes if o['color']==(0,0,0,0) and len(o['path'])>12 and 1.4<(o['bbox'][2]-o['bbox'][0])/(o['bbox'][3]-o['bbox'][1] or 1)<2.5 and math.hypot(cx-(o['bbox'][0]+o['bbox'][2])/2,cy-(o['bbox'][1]+o['bbox'][3])/2)<radius*.3]
   if not eye_details:continue
   for other in shapes:
    if other is shape or other['color']!=(0,0,0,.6):continue
    ob=other['bbox'];ox=(ob[0]+ob[2])/2;oy=(ob[1]+ob[3])/2
    if math.hypot(cx-ox,cy-oy)>radius*.4:continue
    previous=None
    for op,ps in other['path']:
     p=ps[-1]
     if op==b'l' and previous and abs(p[0]-previous[0])>radius*.8 and abs(p[1]-previous[1])>radius*.8:cross=True
     previous=p
   circles.append({'x':cx,'y':cy,'linked':not cross,'radius':radius})
 return circles
out=[]
for page in range(8,53):
 icons=extract(r.pages[page]);im=Image.open(rendered/f'page-{page+1}.png').convert('RGB');visible=[]
 for icon in icons:
  cx=icon['x']*2;cy=im.height-icon['y']*2;radius=icon['radius']*2
  sample=lambda angle:im.getpixel((round(cx+.75*radius*math.cos(angle)),round(cy+.75*radius*math.sin(angle))))
  grey=sum(max(c)-min(c)<=5 and abs(sum(c)/3-119)<12 for c in [sample(i*math.pi/12) for i in range(24)])
  if grey<8:continue # Ignore hidden/clipped eye paths retained in PDF content.
  slash=all(min(sample(angle))>215 for angle in [math.pi/4,math.pi*5/4])
  if slash==icon['linked']:raise ValueError(f'Page {page+1}: raster/vector symbol disagreement')
  icon['rasterGreySamples']=grey;visible.append(icon)
 out.append({'page':page+1,'icons':visible})
Path(sys.argv[3]).write_text(json.dumps(out,indent=2)+'\n')
print(f'{sum(len(p["icons"]) for p in out)} visible symbols extracted and raster-checked across {len(out)} pages')
