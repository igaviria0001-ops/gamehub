# dibuja el trazado (vista de arriba) y revisa radios mínimos y cruces
import sys, json, math
from PIL import Image, ImageDraw
pts = json.load(open(sys.argv[1]))
n = len(pts)
def cr(p0,p1,p2,p3,t,alpha=0.5):
    def tj(ti,pi,pj): return ti + max(1e-6, math.dist(pi,pj))**alpha
    t0=0; t1=tj(t0,p0,p1); t2=tj(t1,p1,p2); t3=tj(t2,p2,p3); tt=t1+(t2-t1)*t
    def L(a,b,ta,tb): return [ (tb-tt)/(tb-ta)*a[i] + (tt-ta)/(tb-ta)*b[i] for i in range(len(a))]
    A1=L(p0,p1,t0,t1); A2=L(p1,p2,t1,t2); A3=L(p2,p3,t2,t3); B1=L(A1,A2,t0,t2); B2=L(A2,A3,t1,t3); return L(B1,B2,t1,t2)
P=[(p[0],p[1],p[2]) for p in pts]
curve=[]
for i in range(n):
    for k in range(40): curve.append(cr(P[i-1],P[i],P[(i+1)%n],P[(i+2)%n],k/40))
L=sum(math.dist(curve[i],curve[(i+1)%len(curve)]) for i in range(len(curve)))
xs=[c[0] for c in curve]; zs=[c[1] for c in curve]
mnx,mxx,mnz,mxz=min(xs)-60,max(xs)+60,min(zs)-60,max(zs)+60
S=900/max(mxx-mnx,mxz-mnz); im=Image.new('RGB',(int((mxx-mnx)*S),int((mxz-mnz)*S)),(20,30,40)); d=ImageDraw.Draw(im)
T=lambda x,z:((x-mnx)*S,(z-mnz)*S)
for i in range(len(curve)):
    a=curve[i]; b=curve[(i+1)%len(curve)]; h=(a[2]+5)/30
    d.line([T(a[0],a[1]),T(b[0],b[1])],fill=(int(80+170*min(1,h)),200,120),width=max(2,int(14*S)))
for i,p in enumerate(P): d.text(T(p[0],p[1]),str(i),fill=(255,255,0))
# radio mínimo (en el plano)
mr=1e9
for i in range(0,len(curve),2):
    a=curve[i-4];b=curve[i];c=curve[(i+4)%len(curve)]
    ab=math.dist(a[:2],b[:2]);bc=math.dist(b[:2],c[:2]);ca=math.dist(c[:2],a[:2])
    ar=abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2
    if ar>1e-6: mr=min(mr,ab*bc*ca/(4*ar))
d.ellipse([T(*P[0][:2])[0]-6,T(*P[0][:2])[1]-6,T(*P[0][:2])[0]+6,T(*P[0][:2])[1]+6],outline=(255,255,255),width=2)
im.save(sys.argv[2]); print('largo %.0f m, radio min %.0f m'%(L,mr))
