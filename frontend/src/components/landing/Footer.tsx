export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.png" alt="Synca Logo" className="w-8 h-8" />
              <span className="text-xl font-bold text-white">Synca</span>
            </div>
            <p className="text-sm">Seu tempo e dinheiro, finalmente conectados</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Recursos</a></li>
              <li><a href="#" className="hover:text-white">Preços</a></li>
              <li><a href="#" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Sobre</a></li>
              <li><a href="#" className="hover:text-white">Contato</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-white">Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p>© 2025 Synca. Todos os direitos reservados.</p>
          <p className="mt-2">🔒 Pagamento seguro • 📱 Dados protegidos • ✅ Cancelamento fácil</p>
        </div>
      </div>
    </footer>
  );
}
