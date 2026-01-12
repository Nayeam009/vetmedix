import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Bell, CheckCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const NotificationsPage = () => {
  const { user } = useAuth();
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getNotificationLink = (notification: any) => {
    if (notification.target_post_id) {
      return `/post/${notification.target_post_id}`;
    }
    if (notification.target_pet_id) {
      return `/pet/${notification.target_pet_id}`;
    }
    return '#';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view notifications</h1>
          <p className="text-muted-foreground mb-6">Get updates on likes, comments, and new followers</p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When someone interacts with your pets, you'll see it here
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to={getNotificationLink(notification)}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted ${
                      !notification.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.actor_pet?.avatar_url || ''} />
                        <AvatarFallback>
                          {notification.actor_pet?.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-full">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-muted-foreground truncate">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="h-2 w-2 bg-primary rounded-full mt-2" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default NotificationsPage;
