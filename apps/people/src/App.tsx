import { Register } from "./features/register/Register";
import { resetToSeed } from "./store";
import { useAppDispatch } from "./store/hooks";

export function App() {
  const dispatch = useAppDispatch();
  return (
    <main>
      <header>
        <h1>People</h1>
        <button type="button" onClick={() => dispatch(resetToSeed())}>
          Reset to seed
        </button>
      </header>
      <Register />
    </main>
  );
}
