import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { ToastProvider } from './components/ui/Toast';

const Home = lazy(() => import('./pages/Home'));
const Input = lazy(() => import('./pages/Input'));
const Study = lazy(() => import('./pages/Study'));
const EditSet = lazy(() => import('./pages/EditSet'));
const FlashcardGame = lazy(() => import('./pages/Game/Flashcard'));
const MultipleChoiceGame = lazy(() => import('./pages/Game/MultipleChoice'));
const FillInGame = lazy(() => import('./pages/Game/FillIn'));
const MatchingGame = lazy(() => import('./pages/Game/Matching'));
const FallingGame = lazy(() => import('./pages/Game/Falling'));
const SpeedQuizGame = lazy(() => import('./pages/Game/SpeedQuiz'));
const CloudJumpGame = lazy(() => import('./pages/Game/CloudJump'));
const TypewriterGame = lazy(() => import('./pages/Game/Typewriter'));
const MissingLettersGame = lazy(() => import('./pages/Game/MissingLetters'));
const Worksheet = lazy(() => import('./pages/Worksheet'));
const SharedWorksheet = lazy(() => import('./pages/SharedWorksheet'));
const SharedSet = lazy(() => import('./pages/SharedSet'));
const SharedGame = lazy(() => import('./pages/SharedGame'));
const Records = lazy(() => import('./pages/Records'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <NavBar />
        <main>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/input" element={<Input />} />
              <Route path="/study/:setId" element={<Study />} />
              <Route path="/edit/:setId" element={<EditSet />} />
              <Route path="/game/flashcard/:setId" element={<FlashcardGame />} />
              <Route path="/game/multiple-choice/:setId" element={<MultipleChoiceGame />} />
              <Route path="/game/fill-in/:setId" element={<FillInGame />} />
              <Route path="/game/matching/:setId" element={<MatchingGame />} />
              <Route path="/game/falling/:setId" element={<FallingGame />} />
              <Route path="/game/speed-quiz/:setId" element={<SpeedQuizGame />} />
              <Route path="/game/cloud-jump/:setId" element={<CloudJumpGame />} />
              <Route path="/game/typewriter/:setId" element={<TypewriterGame />} />
              <Route path="/game/missing-letters/:setId" element={<MissingLettersGame />} />
              <Route path="/worksheet/:setId" element={<Worksheet />} />
              <Route path="/share/worksheet" element={<SharedWorksheet />} />
              <Route path="/shared/set" element={<SharedSet />} />
              <Route path="/shared/game" element={<SharedGame />} />
              <Route path="/records" element={<Records />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </main>
      </BrowserRouter>
    </ToastProvider>
  );
}
