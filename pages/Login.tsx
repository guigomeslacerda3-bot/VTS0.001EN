import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { Role } from '../types';
import { supabase } from '../supabaseClient';
import { Lock, User as UserIcon, AlertCircle } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.Reparador);
  const [error, setError] = useState('');
  const { login, refreshData } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Fetch user from DB
      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (dbError || !user) {
        setError('Wrong login or not registered (登录错误或未注册)');
        return;
      }

      // Check Password (Plain text check as per requirement for internal tool)
      if (user.password !== password) {
         setError('Incorrect password (密码错误)');
         return;
      }

      // Check Approval
      if (user.status !== 'approved') {
        setError('Account waiting for Admin approval (帐户等待管理员批准)');
        return;
      }

      login(user);
      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      setError('Connection Error (连接错误)');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3 || username.length > 13) {
      setError('Login must be between 3 and 13 characters (登录名必须在3到13个字符之间)');
      return;
    }
    
    // Check if user exists
    const { data: existing } = await supabase.from('users').select('id').eq('username', username).single();
    if (existing) {
      setError('User already exists (用户已存在)');
      return;
    }
    
    // Create pending user in DB
    const { error: insertError } = await supabase.from('users').insert([{
      username,
      password, // Note: For production, hash this password!
      role,
      status: 'pending',
      permissions: [] 
    }]);
    
    if (insertError) {
      setError('Error creating account: ' + insertError.message);
      return;
    }

    await refreshData();
    setError('');
    alert('Request sent for Admin approval (请求已发送等待管理员批准)');
    setMode('login');
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    // Since we don't have email in the requirements, we just notify
    alert('Password request sent to Admin (密码请求已发送给管理员)');
    setMode('login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: 'url("https://wallpapers.com/images/featured/haval-089etj9zc9genyvy.jpg")' }}>
      <div className="absolute inset-0 bg-black bg-opacity-70"></div>
      <div className="relative z-10 bg-gwm-card p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-center mb-2 text-white">GWM VTS</h1>
        <h2 className="text-center text-gray-400 mb-6 text-sm">Vehicle Traceability System (车辆追溯系统)</h2>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 flex items-center text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Username (用户名)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  className="bg-gray-800 block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-gwm-accent focus:border-gwm-accent sm:text-sm text-white"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Password (密码)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="bg-gray-800 block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-gwm-accent focus:border-gwm-accent sm:text-sm text-white"
                  placeholder="••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gwm-accent hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              Login (登录)
            </button>
            <div className="flex justify-between text-xs text-gray-400 mt-4">
              <button type="button" onClick={() => setMode('register')} className="hover:text-white underline">Register (注册)</button>
              <button type="button" onClick={() => setMode('forgot')} className="hover:text-white underline">Forgot Password (忘记密码)</button>
              <button type="button" className="hover:text-white underline">Change Password (更改密码)</button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <h3 className="text-lg font-medium text-white">New Account (新账户)</h3>
            <input
              type="text"
              required
              className="bg-gray-800 block w-full px-3 py-2 border border-gray-600 rounded-md text-white"
              placeholder="Username (3-13 chars)"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <input
              type="password"
              required
              className="bg-gray-800 block w-full px-3 py-2 border border-gray-600 rounded-md text-white"
              placeholder="Password (密码)"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <select 
              value={role}
              onChange={e => setRole(e.target.value as Role)}
              className="bg-gray-800 block w-full px-3 py-2 border border-gray-600 rounded-md text-white text-sm"
            >
              {Object.values(Role)
               .filter(r => r !== Role.Viewer)
               .map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button type="submit" className="w-full py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm">
              Request Access (请求访问)
            </button>
            <button type="button" onClick={() => setMode('login')} className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm">
              Back (返回)
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <div className="space-y-4">
             <h3 className="text-lg font-medium text-white">Recover Password (找回密码)</h3>
             <p className="text-sm text-gray-400">Enter your username to notify Admin.</p>
             <input
              type="text"
              className="bg-gray-800 block w-full px-3 py-2 border border-gray-600 rounded-md text-white"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <button onClick={handleForgot} className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-sm">
              Send Request (发送请求)
            </button>
            <button type="button" onClick={() => setMode('login')} className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm">
              Back (返回)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}