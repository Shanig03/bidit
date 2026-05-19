import { useGoLive } from '../hooks/useGoLive';
import GoLiveComp from '../components/GoLiveComp';

export default function GoLivePage() {
  const goLiveLogic = useGoLive();

  return <GoLiveComp {...goLiveLogic} />;
}