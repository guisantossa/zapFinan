import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../constants';

export default function Login({ setUsuario }) {
  const [telefone, setTelefone] = useState('');
  const [token, setToken] = useState('');
  const [fase, setFase] = useState('telefone'); // 'telefone' | 'token'
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');


  const handleEnviarTelefone = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      const res = await fetch(`${API_URL}/auth/send-token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone }),
      });
      if (!res.ok) throw new Error('Erro ao enviar token');
      setMensagem('Enviamos um token via WhatsApp');
      setFase('token');
    } catch (err) {
      setErro('Telefone não encontrado ou erro no envio.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      const res = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, token }),
      });
      if (!res.ok) throw new Error('Token inválido');
      const data = await res.json();
      const usuarioLogado = {
        id: data.id,
        nome: data.nome,
        telefone: data.telefone
      };
      localStorage.setItem("zapgastos_usuario", JSON.stringify(usuarioLogado));
      setUsuario(usuarioLogado);
    setMensagem('Login realizado com sucesso!');
    } catch (err) {
      setErro('Token inválido ou expirado.');
    }
  };

  useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenUrl = urlParams.get('token');

  if (tokenUrl) {
    const loginComToken = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${tokenUrl}`
          }
        });
        if (!res.ok) throw new Error('Token inválido');
        const data = await res.json();

        const usuarioLogado = {
          id: data.id,
          nome: data.nome,
          telefone: data.telefone
        };

        localStorage.setItem("zapgastos_usuario", JSON.stringify(usuarioLogado));
        setUsuario(usuarioLogado);
        navigate('/dashboard'); // ou outro destino
      } catch (err) {
        setErro('Token inválido ou expirado.');
        navigate('/login');
      }
    };

    loginComToken();
  }
}, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Entrar no ZapGastos</h2>

        {mensagem && <div className="mb-4 text-green-600 font-semibold">{mensagem}</div>}
        {erro && <div className="mb-4 text-red-500 font-semibold">{erro}</div>}

        {fase === 'telefone' && (
          <form onSubmit={handleEnviarTelefone} className="space-y-4">
            <div>
              <label className="block text-gray-600 mb-1">Telefone (WhatsApp)</label>
              <input
                type="tel"
                placeholder="(21) 91234-5678"
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Enviar token
            </button>
          </form>
        )}

        {fase === 'token' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-600 mb-1">Token recebido no WhatsApp</label>
              <input
                type="text"
                placeholder="Digite o token"
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Entrar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
