export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="mb-4">About</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About CineAI</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4">Help</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4">Social</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Use</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; 2026 CineAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
