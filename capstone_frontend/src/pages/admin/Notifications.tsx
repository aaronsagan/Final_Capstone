import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface NotificationItem {
  id: number;
  type: string;
  title?: string;
  message?: string;
  read: boolean;
  created_at: string;
}

export default function AdminNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/me/notifications?unread=false`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      setItems(list as NotificationItem[]);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    await fetch(`${API_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = items.filter(i => !i.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Review recent system updates and alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Unread: {unreadCount}</Badge>
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>Mark all read</Button>
          <Button variant="outline" onClick={fetchNotifications}>Refresh</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No notifications</div>
          ) : (
            <div className="space-y-3">
              {items.map(n => (
                <div key={n.id} className={`border rounded-md p-4 ${n.read ? '' : 'bg-muted/40'}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {n.title || n.type}
                    </div>
                    {!n.read && <Badge className="bg-blue-100 text-blue-800">New</Badge>}
                  </div>
                  {n.message && <div className="mt-1 text-sm text-muted-foreground">{n.message}</div>}
                  <div className="mt-2 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
