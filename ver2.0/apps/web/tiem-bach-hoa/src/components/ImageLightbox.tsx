import React, { useEffect } from 'react';

type Props = {
  images: string[];
  startIndex?: number;
  onClose: () => void;
};

export default function ImageLightbox({ images, startIndex = 0, onClose }: Props) {
  const [index, setIndex] = React.useState<number>(startIndex);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex(i => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [images.length, onClose]);

  if (!images || images.length === 0) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <button aria-label="Close" style={closeBtnStyle} onClick={onClose}>✕</button>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <button onClick={()=>setIndex(i=>Math.max(i-1,0))} style={navBtnStyle} disabled={index===0}>◀</button>
          <div style={{maxWidth:'80vw', maxHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <img src={images[index]} alt={`img-${index}`} style={{maxWidth:'80vw', maxHeight:'80vh', objectFit:'contain'}} />
          </div>
          <button onClick={()=>setIndex(i=>Math.min(i+1, images.length-1))} style={navBtnStyle} disabled={index===images.length-1}>▶</button>
        </div>
        <div style={{marginTop:8, color:'#fff', textAlign:'center'}}>{index+1} / {images.length}</div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000
};
const contentStyle: React.CSSProperties = { position:'relative', padding:12 };
const closeBtnStyle: React.CSSProperties = { position:'absolute', right:8, top:8, background:'transparent', border:'none', color:'#fff', fontSize:20, cursor:'pointer' };
const navBtnStyle: React.CSSProperties = { background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff', padding:'8px 10px', borderRadius:6, cursor:'pointer' };
