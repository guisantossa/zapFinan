import { Search, Bell, Plus, User, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface HeaderProps {
  onNewCharge: () => void;
}

export function Header({ onNewCharge }: HeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="flex items-center justify-between px-6 h-full">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar..."
            className="pl-10 bg-gray-50 border-gray-200 rounded-2xl"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* New Charge Button */}
          <Button 
            onClick={onNewCharge}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-2xl px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Cobrança
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative rounded-2xl">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-1 rounded-2xl">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-[#1E3A8A] text-white">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl">
              <DropdownMenuItem className="rounded-xl">
                <User className="w-4 h-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}