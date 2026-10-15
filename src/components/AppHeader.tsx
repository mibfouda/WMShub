import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Menu, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // في حال قمت بتفعيل السيرفر/supabase لاحقاً

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export default function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { user, signOut } = useAuth(); // سيعمل بمجرد ربط الـ AuthContext

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        
        {/* الجانب الأيسر: القائمة الجانبية والشعار */}
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link to="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight">
            <span>WMShub</span>
          </Link>
        </div>

        {/* الجانب الأيمن: أزرار التحكم والتعريف (تم حذف أزرار الإعجاب/القلب) */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/reports">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </div>

      </div>
    </header>
  );
}
