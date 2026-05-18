import { useLogin } from '../hooks/useLogin';
import LoginComp from '../components/LoginComp';

export default function LoginPage() {
  const { executeLogin, executeGoogleLogin, error, loading } = useLogin();

  return (
    <LoginComp 
      onSubmit={executeLogin} 
      onGoogleLogin={executeGoogleLogin} 
      error={error} 
      loading={loading} 
    />
  );
}