import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC] dark:bg-slate-900 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full text-center"
          >
            <div className="p-8 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Oops! Algo deu errado
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Ocorreu um erro inesperado. Tente recarregar a página ou entrar em contato com o suporte.
                </p>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-left">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Erro (desenvolvimento):</p>
                    <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={this.handleReload}
                    className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E40AF] hover:to-[#2563EB]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recarregar Página
                  </Button>

                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    className="w-full"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}