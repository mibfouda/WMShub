import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Menu, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; 

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export default function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { user, signOut } = useAuth(); 

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        
        {/* الجانب الأيسر: زر القائمة، صورة المشروع والشعار */}
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <Link to="/" className="flex items-center gap-3 font-bold text-xl tracking-tight">
            {/* عرض صورة واجهة لوحة تحكم WasteOps بشكل مصغر وأنيق بجانب النص */}
            <img 
              src="https://www.instagram.com/p/DNf7nKEqonO/" 
              alt="WasteOps Dashboard" 
              className="h-8 w-8 rounded-md object-cover border border-muted"
            />
            <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
              WMShub <span className="text-xs font-normal text-muted-foreground ml-1">Powered by WasteOps</span>
            </span>
          </Link>
        </div>

        {/* الجانب الأيمن: أزرار التحكم والتعريف وتتبع الحساب */}
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
