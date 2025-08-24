"use client";
import { useEffect, useRef, useState } from "react";

export default function Toast(){
  const [list, setList] = useState<{id:number;kind:"success"|"error";msg:string}[]>([]);
  const idRef = useRef(1);
  useEffect(()=>{
    function on(e:any){
      const d = e.detail || { kind:"success", msg:"Ok" };
      const id = idRef.current++;
      setList(prev => [...prev, { id, kind: d.kind, msg: d.msg }]);
      setTimeout(()=>setList(prev=>prev.filter(x=>x.id!==id)), 3500);
    }
    window.addEventListener("toast", on as any);
    return ()=>window.removeEventListener("toast", on as any);
  },[]);
  return (
    <div className="toast-wrap">
      {list.map(t => <div key={t.id} className={"toast "+t.kind}>{t.msg}</div>)}
    </div>
  );
}
