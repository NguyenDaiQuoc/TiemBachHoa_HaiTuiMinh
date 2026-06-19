import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProfileLayout } from './ui/profile-layout';

// Tabs
import { ProfileTab } from './profile-tab';
import { OrdersTab } from './orders-tab';
import { AddressesTab } from './addresses-tab';
import { SecurityTab } from './security-tab';
import { WishlistTab } from './wishlist-tab';
import { RecentlyViewedTab } from './recently-viewed-tab';
import { MembershipTab } from './membership-tab';
import { SettingsTab } from './settings-tab';
import { NotificationsTab } from './notifications-tab';

export const ProfilePage: React.FC = () => {
  return (
    <Routes>
      <Route element={<ProfileLayout />}>
        <Route index element={<ProfileTab />} />
        <Route path="orders" element={<OrdersTab />} />
        <Route path="addresses" element={<AddressesTab />} />
        <Route path="security" element={<SecurityTab />} />
        <Route path="wishlist" element={<WishlistTab />} />
        <Route path="recently-viewed" element={<RecentlyViewedTab />} />
        <Route path="membership" element={<MembershipTab />} />
        <Route path="notifications" element={<NotificationsTab />} />
        <Route path="settings" element={<SettingsTab />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
};

export default ProfilePage;

