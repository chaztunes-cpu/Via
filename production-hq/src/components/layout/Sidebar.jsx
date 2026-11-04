import { NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from './navigation.js';

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors ${
          isActive
            ? 'bg-white/[0.07] font-medium text-zinc-100'
            : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`size-4 shrink-0 ${isActive ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-400'}`}
            strokeWidth={1.75}
          />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2.5 pt-2" aria-label="Main">
        <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-600">Workspace</p>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-line px-2.5 py-3">
        {SECONDARY_NAV_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}
