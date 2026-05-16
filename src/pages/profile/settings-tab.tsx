import React from 'react';
import { Card } from '@/src/shared/ui/card';
import { Bell, Shield, Smartphone, Mail, Globe, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { Switch } from '@/src/shared/ui/switch';
import { useNotificationSettings, useUpdateNotificationSetting } from '@/src/entities/user/api/user-api';
import { toast } from 'sonner';

export const SettingsTab: React.FC = () => {
  const { data: settings, isLoading } = useNotificationSettings();
  const updateMutation = useUpdateNotificationSetting();

  const handleToggle = async (type: string, field: 'email' | 'sms' | 'push', value: boolean) => {
    try {
      await updateMutation.mutateAsync({
        type,
        data: { [field]: value }
      });
      toast.success('Đã cập nhật cài đặt');
    } catch (error) {
      toast.error('Lỗi khi cập nhật cài đặt');
    }
  };

  const sections = [
    {
      id: 'ORDER_UPDATE',
      title: 'THÔNG BÁO ĐƠN HÀNG',
      desc: 'Cập nhật về trạng thái thanh toán, vận chuyển và giao hàng',
      icon: Shield,
    },
    {
      id: 'PROMOTION',
      title: 'ƯU ĐÃI & KHUYẾN MÃI',
      desc: 'Thông tin về Flash Sales, Vouchers và chương trình thành viên',
      icon: Bell,
    },
    {
      id: 'NEWSLETTER',
      title: 'BẢN TIN CỬA HÀNG',
      desc: 'Sản phẩm mới, xu hướng mua sắm và tin tức từ Hai Tụi Mình',
      icon: Globe,
    }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Đang tải cài đặt...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h3 className="text-xl font-black italic uppercase tracking-tight ml-2">CÀI ĐẶT THÔNG BÁO</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {sections.map((section) => {
            const setting = settings?.find(s => s.type === section.id) || { email: true, sms: false, push: true };
            
            return (
              <Card key={section.id} className="p-8 border-none shadow-soft bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <section.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight">{section.title}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-relaxed max-w-md uppercase tracking-wider">{section.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 md:border-l md:border-border/50 md:pl-8">
                    <div className="flex flex-col items-center gap-2">
                       <span className="text-[8px] font-black uppercase tracking-widest opacity-40 text-muted-foreground">Email</span>
                       <Switch 
                         checked={setting.email} 
                         onCheckedChange={(val) => handleToggle(section.id, 'email', val)} 
                         className="data-[state=checked]:bg-primary"
                       />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                       <span className="text-[8px] font-black uppercase tracking-widest opacity-40 text-muted-foreground">SMS</span>
                       <Switch 
                         checked={setting.sms} 
                         onCheckedChange={(val) => handleToggle(section.id, 'sms', val)} 
                         className="data-[state=checked]:bg-primary"
                       />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                       <span className="text-[8px] font-black uppercase tracking-widest opacity-40 text-muted-foreground">Push</span>
                       <Switch 
                         checked={setting.push} 
                         onCheckedChange={(val) => handleToggle(section.id, 'push', val)} 
                         className="data-[state=checked]:bg-primary"
                       />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quiet Hours */}
      <Card className="p-8 border-none shadow-soft bg-white/40 dark:bg-slate-900/40 border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight">QUIET HOURS</h4>
              <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">Không làm phiền từ 22:00 - 08:00 hôm sau</p>
            </div>
          </div>
          <Switch disabled checked={true} />
        </div>
      </Card>
    </div>
  );
};
