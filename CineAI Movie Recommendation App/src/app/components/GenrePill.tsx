interface GenrePillProps {
  name: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function GenrePill({ name, icon, active = false, onClick }: GenrePillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
        active
          ? 'bg-primary border-primary text-primary-foreground'
          : 'bg-card border-border text-foreground hover:border-primary'
      }`}
    >
      {icon}
      <span>{name}</span>
    </button>
  );
}
