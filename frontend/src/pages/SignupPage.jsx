import { useSignup } from '../hooks/useSignup';
import SignUpComp from '../components/SignUpComp';

export default function SignupPage() {
  const { executeSignup, error, loading } = useSignup();

  return (
    <SignUpComp 
      onSubmit={executeSignup} 
      error={error} 
      loading={loading} 
    />
  );
}