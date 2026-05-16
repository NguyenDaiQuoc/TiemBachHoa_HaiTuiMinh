export const AdminSettings = () => {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tighter uppercase italic">Cấu hình <span className="text-primary italic">Hệ thống</span></h1>
        <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mt-1 opacity-60">Quản lý tài khoản & Thiết lập cửa hàng</p>
      </div>

      <div className="max-w-3xl space-y-8">
         <div className="bg-surface-default p-10 rounded-[40px] border border-border/50 shadow-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-4">
               Thông tin cửa hàng
               <div className="h-px bg-border/50 flex-1" />
            </h3>
            
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Tên cửa hàng</label>
                     <input type="text" defaultValue="Tiệm Bách Hoá Hai Tụi Mình" className="w-full h-12 px-5 bg-surface-sunken border-none rounded-2xl text-xs font-bold" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Email liên hệ</label>
                     <input type="text" defaultValue="haitumiminh@gmail.com" className="w-full h-12 px-5 bg-surface-sunken border-none rounded-2xl text-xs font-bold" />
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
