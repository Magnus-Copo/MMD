import { Toaster } from 'sonner@2.0.3';
import { LeadsPage } from './components/LeadsPage';

export default function App() {
  return (
    <>
      <LeadsPage />
      <Toaster position="top-right" />
    </>
  );
}
