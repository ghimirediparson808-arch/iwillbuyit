"""Create QA-only side-by-side comparisons; never writes source assets."""
from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[2]
qa=root/'website-app/qa'
specs=[('landing','01-landing-page'),('gallery','02-design-gallery'),('detail','03-design-detail'),('customize','04-customize-design'),('login','05-admin-login'),('dashboard','06-admin-dashboard'),('create','07-admin-create-design'),('requests','08-admin-requests-orders')]
for page,stem in specs:
 for size in ['desktop','tablet','mobile']:
  reference=root/('reference/'+stem+'.png' if size=='desktop' else f'responsive-reference/{size}/{stem}-{size}.png')
  actual=qa/f'{page}-{size}.png'
  if not actual.exists():continue
  images=[Image.open(p).convert('RGB') for p in [reference,actual]]
  width=800 if size=='desktop' else 600 if size=='tablet' else 440
  height=round(images[0].height*width/images[0].width)
  canvas=Image.new('RGB',(width*2,height+30),'#e3e8ef')
  draw=ImageDraw.Draw(canvas)
  for i,im in enumerate(images):
   canvas.paste(im.resize((width,height)),(i*width,30))
   draw.text((i*width+12,8),f'{page} {size} - '+('REFERENCE' if i==0 else 'IMPLEMENTATION'),fill='#062e59')
  canvas.save(qa/f'compare-{page}-{size}.png')
