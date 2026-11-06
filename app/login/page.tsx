import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  // useSearchParams no formulário exige Suspense para a página poder ser pré-renderizada.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
