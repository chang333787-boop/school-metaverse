# git 충돌 표시 자리만 풀기: 그 자리의 theirs 줄과 짝인 base 줄을 찾아, base→theirs 문자 바꿈을 ours 줄에 적용
import sys, subprocess, difflib
f=sys.argv[1]
B=subprocess.run(['git','show',':1:'+f],capture_output=True,text=True).stdout.split('\n')
src=open(f).read().split('\n'); out=[]; rep=[]; i=0
def charapply(o,b,t):
    for op,x1,x2,y1,y2 in reversed(difflib.SequenceMatcher(None,b,t,autojunk=False).get_opcodes()):
        if op=='equal': continue
        for w in (80,50,30,15):
            ctx=b[max(0,x1-w):x1]; aft=b[x2:x2+w]
            for key,off in ((ctx+b[x1:x2]+aft,len(ctx)),(ctx+b[x1:x2],len(ctx)),(b[x1:x2]+aft,0)):
                if key and o.count(key)==1: k=o.find(key)+off; o=o[:k]+t[y1:y2]+o[k+(x2-x1):]; break
            else: continue
            break
        else: return None
    return o
while i<len(src):
    if not src[i].startswith('<<<<<<< '): out.append(src[i]); i+=1; continue
    j=i+1; O=[]
    while not src[j].startswith('======='): O.append(src[j]); j+=1
    j+=1; T=[]
    while not src[j].startswith('>>>>>>> '): T.append(src[j]); j+=1
    ok=len(O)==len(T); res=[]
    if ok:
        for o,t in zip(O,T):
            c=[b for b in B if b[:20]==t[:20] and b.strip()]
            if not c: ok=False; break
            b=max(c,key=lambda b: difflib.SequenceMatcher(None,b,t,autojunk=False).ratio())
            r=charapply(o,b,t)
            if r is None: ok=False; break
            res.append(r)
    if ok: out+=res
    else: out+=['<<<<<<< ours']+O+['=======']+T+['>>>>>>> theirs']; rep.append('못 풂 @%d'%i)
    i=j+1
open(f,'w').write('\n'.join(out)); print(f,'풀림' if not rep else rep)
