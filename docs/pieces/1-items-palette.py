import colorsys, json
def lum(r,g,b):
    f=lambda x: x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4
    return .2126*f(r)+.7152*f(g)+.0722*f(b)
def hx(r,g,b): return '#%02x%02x%02x'%tuple(round(x*255) for x in (r,g,b))
def at(h,s,target):
    lo,hi=0,1
    for _ in range(40):
        m=(lo+hi)/2; r,g,b=colorsys.hls_to_rgb(h/360,m,s)
        if lum(r,g,b)<target: lo=m
        else: hi=m
    return hx(*colorsys.hls_to_rgb(h/360,lo,s))
def cr(a,b):
    A=lum(*[int(a[i:i+2],16)/255 for i in (1,3,5)]); B=lum(*[int(b[i:i+2],16)/255 for i in (1,3,5)])
    return (max(A,B)+.05)/(min(A,B)+.05)
H={'ore':(12,.62),'coal':(215,.10),'stone':(36,.45),'quartz':(182,.70),'ingot':(205,.18),'plate':(214,.80),
   'wire':(32,.85),'concrete':(28,.10),'silica':(155,.60),'frame':(330,.70),'circuit':(128,.62),'motor':(78,.75)}
# B: one tone between machine and terrain
B={k:at(h,s,.226) for k,(h,s) in H.items()}
# C: deep on ground/panels, light on machines
deepL={'coal':.035,'ingot':.11,'concrete':.13,'stone':.14}
C_deep={k:at(h,s,deepL.get(k,.12)) for k,(h,s) in H.items()}
C_light={k:at(h,(s if k in ('coal','ingot','concrete') else min(1,s+.25)),{'coal':.42,'ingot':.80,'concrete':.45}.get(k,.55)) for k,(h,s) in H.items()}
for name,p in (('B',B),('Cdeep',C_deep),('Clight',C_light)):
    print(name, ' '.join(f"{k}:{v} t{cr(v,'#eef0ef'):.1f}/w{cr(v,'#ffffff'):.1f}/m{cr(v,'#2c353c'):.1f}" for k,v in p.items()))
json.dump({'B':B,'Cdeep':C_deep,'Clight':C_light},open('pal.json','w'))
