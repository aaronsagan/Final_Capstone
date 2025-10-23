import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Trash2, TrendingUp, Users, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { authService } from "@/services/auth";

interface NotificationItem {
  id: number;
  title?: string;
  message: string;
  type?: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

export default function CharityNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/me/notifications`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to load notifications');
      const payload = await res.json();
      const list: NotificationItem[] = payload.data ?? payload;
      setItems(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = authService.getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      setItems((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
      setItems((prev) => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to mark all as read');
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const token = authService.getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete notification');
      setItems((prev) => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to delete notification');
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'donation_received':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'new_volunteer':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'document_expiring':
        return <FileText className="h-4 w-4 text-orange-600" />;
      case 'report_submitted':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Bell className="h-6 w-6" /> Notifications
        </h1>
        <p className="text-muted-foreground">Stay updated with your charity's activity and updates.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inbox</CardTitle>
              <CardDescription>Your latest notifications</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={loading}>
                Refresh
              </Button>
              <Button variant="default" size="sm" onClick={markAllAsRead} disabled={loading || items.every(n => n.is_read)}>
                <CheckCheck className="h-4 w-4 mr-2" /> Mark all as read
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading notifications...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No notifications yet.</div>
          ) : (
            <div className="space-y-4">
              {items.map((n) => (
                <div key={n.id} className={`p-4 border rounded-lg ${!n.is_read ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">
                          {n.title || (n.type ? n.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Notification')}
                        </h3>
                        <div className="flex items-center gap-2">
                          {n.is_read ? (
                            <Badge variant="secondary">Read</Badge>
                          ) : (
                            <Badge>Unread</Badge>
                          )}
                          <div className="flex gap-1">
                            {!n.is_read && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markAsRead(n.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteNotification(n.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
